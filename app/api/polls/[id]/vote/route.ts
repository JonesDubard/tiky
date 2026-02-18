// app/api/polls/[id]/vote/route.ts - FINAL FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const { optionId, deviceId } = await req.json();
    const { id: pollId } = params;

    // Get poll with details
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { 
        options: true,
        event: true
      }
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Validate poll status
    if (poll.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This poll is closed' },
        { status: 403 }
      );
    }

    if (poll.endDate && poll.endDate < new Date()) {
      // Auto-close expired poll
      await prisma.poll.update({
        where: { id: pollId },
        data: { status: 'CLOSED' }
      });
      return NextResponse.json(
        { error: 'This poll has expired' },
        { status: 403 }
      );
    }

    // Verify option belongs to poll
    const validOption = poll.options.find(opt => opt.id === optionId);
    if (!validOption) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Handle different poll types
    let userId = null;
    let validTokens = 0;

    // For registered users
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          orders: {
            where: {
              status: 'CONFIRMED',
              tickets: {
                some: {
                  status: 'PAID'
                }
              }
            },
            include: {
              tickets: {
                where: {
                  status: 'PAID'
                }
              }
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      userId = user.id;

      // For PAID polls, check token/ticket count
      if (poll.pollType === 'PAID') {
        // Count valid tickets for this event (if poll is event-specific)
        if (poll.eventId) {
          validTokens = user.orders.reduce((total, order) => {
            return total + order.tickets.length;
          }, 0);
        } else {
          // For non-event polls, check if user has any valid tickets
          validTokens = user.orders.length > 0 ? 1 : 0;
        }

        if (validTokens === 0) {
          return NextResponse.json(
            { error: 'You need a valid ticket to vote in this poll' },
            { status: 403 }
          );
        }
      }
    } 
    // Guest voting for FREE polls
    else if (poll.pollType === 'FREE') {
      if (!deviceId) {
        return NextResponse.json(
          { error: 'Device ID required for guest voting' },
          { status: 400 }
        );
      }
    } 
    // PAID poll requires login
    else {
      return NextResponse.json(
        { error: 'Please log in to vote in this poll' },
        { status: 401 }
      );
    }

    // Check for existing votes - WITHOUT using metadata path queries
    let existingVote = null;
    
    if (userId) {
      existingVote = await prisma.vote.findUnique({
        where: {
          pollId_userId: {
            pollId,
            userId
          }
        }
      });
    } else if (deviceId) {
      // Use deviceId field directly instead of metadata path
      existingVote = await prisma.vote.findFirst({
        where: {
          pollId,
          userId: null,
          deviceId: deviceId
        }
      });
    }

    // Handle multiple votes for token holders
    if (existingVote) {
      if (poll.pollType === 'PAID' && validTokens > 1) {
        // Allow multiple votes if user has multiple tokens
        const vote = await prisma.vote.create({
          data: {
            pollId,
            optionId,
            userId,
            deviceId: null,
            metadata: JSON.stringify({
              tokenUsed: true,
              remainingTokens: validTokens - 1
            })
          },
          include: {
            option: true
          }
        });

        // Get updated vote counts
        const updatedPoll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true }
                }
              }
            },
            _count: {
              select: { votes: true }
            }
          }
        });

        return NextResponse.json({
          success: true,
          vote,
          message: `Vote recorded! You have ${validTokens - 1} votes remaining`,
          poll: updatedPoll,
          remainingVotes: validTokens - 1
        });
      } else {
        return NextResponse.json(
          { error: 'You have already voted in this poll' },
          { status: 409 }
        );
      }
    }

    // Create new vote
    const vote = await prisma.vote.create({
      data: {
        pollId,
        optionId,
        userId,
        deviceId: deviceId || null,
        metadata: poll.pollType === 'PAID' 
          ? JSON.stringify({
              tokenUsed: true,
              remainingTokens: validTokens - 1
            })
          : null
      },
      include: {
        option: true
      }
    });

    // Get updated poll with vote counts
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      vote,
      message: poll.pollType === 'PAID' && validTokens > 1 
        ? `Vote recorded! You have ${validTokens - 1} votes remaining`
        : 'Vote recorded successfully',
      poll: updatedPoll,
      remainingVotes: validTokens > 1 ? validTokens - 1 : 0
    });

  } catch (error: any) {
    console.error('[VOTE_ERROR]', error);
    
    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already voted in this poll' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}

// GET endpoint for vote status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    const { id: pollId } = params;

    let userVotes: any[] = [];
    let remainingVotes = 0;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          votes: {
            where: { pollId },
            include: { option: true }
          },
          orders: {
            where: { status: 'CONFIRMED' },
            include: {
              tickets: {
                where: { status: 'PAID' }
              }
            }
          }
        }
      });

      if (user) {
        userVotes = user.votes;
        
        // Calculate remaining votes based on tickets
        const poll = await prisma.poll.findUnique({
          where: { id: pollId }
        });

        if (poll?.pollType === 'PAID') {
          const totalTickets = user.orders.reduce((total, order) => {
            return total + order.tickets.length;
          }, 0);
          remainingVotes = Math.max(0, totalTickets - userVotes.length);
        }
      }
    } else if (deviceId) {
      userVotes = await prisma.vote.findMany({
        where: {
          pollId,
          userId: null,
          deviceId: deviceId
        },
        include: { option: true }
      });
    }

    return NextResponse.json({
      votes: userVotes.map(v => ({
        id: v.id,
        optionId: v.optionId,
        optionText: v.option.text,
        createdAt: v.createdAt
      })),
      voteCount: userVotes.length,
      remainingVotes
    });

  } catch (error) {
    console.error('[VOTE_CHECK_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}