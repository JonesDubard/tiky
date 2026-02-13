import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    // Liberia: Allow guest voting? If yes, use device fingerprint
    const { optionId, deviceId } = await req.json();
    const { id: pollId } = params;

    // Authentication check
    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      userId = user?.id;
    }

    // Liberia: Guest voting fallback using device fingerprint
    const voterId = userId || deviceId;
    if (!voterId) {
      return NextResponse.json(
        { error: 'Authentication required or device ID missing' },
        { status: 401 }
      );
    }

    // Atomic vote with conflict handling
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if poll exists and is active
      const poll = await tx.poll.findUnique({
        where: { id: pollId },
        include: { 
          options: true,
          _count: {
            select: { votes: true }
          }
        }
      });

      if (!poll) {
        throw new Error('POLL_NOT_FOUND');
      }

      if (poll.status !== 'ACTIVE') {
        throw new Error('POLL_CLOSED');
      }

      if (poll.endDate && poll.endDate < new Date()) {
        // Auto-close expired poll
        await tx.poll.update({
          where: { id: pollId },
          data: { status: 'CLOSED' }
        });
        throw new Error('POLL_EXPIRED');
      }

      // 2. Verify option belongs to this poll
      const validOption = poll.options.find(opt => opt.id === optionId);
      if (!validOption) {
        throw new Error('INVALID_OPTION');
      }

      // 3. For registered users: use unique constraint
      // For guests: manually check if device has voted
      if (userId) {
        // Try to create vote - will fail on duplicate due to @@unique
        const vote = await tx.vote.create({
          data: {
            pollId,
            optionId,
            userId
          }
        });
        
        return { vote, pollTitle: poll.title, optionText: validOption.text };
      } else {
        // Guest voting: Check device fingerprint
        const existingVote = await tx.vote.findFirst({
          where: {
            pollId,
            user: null, // Guest votes have no userId
            metadata: {
              path: ['deviceId'],
              equals: deviceId
            }
          }
        });

        if (existingVote) {
          throw new Error('ALREADY_VOTED');
        }

        // Create guest vote
        const vote = await tx.vote.create({
          data: {
            pollId,
            optionId,
            userId: null, // Guest vote
            metadata: {
              deviceId,
              votedAt: new Date().toISOString(),
              userAgent: req.headers.get('user-agent')
            }
          }
        });

        return { vote, pollTitle: poll.title, optionText: validOption.text };
      }
    }, {
      isolationLevel: 'Serializable',
      timeout: 5000
    });

    return NextResponse.json({ 
      success: true, 
      voteId: result.vote.id,
      message: `Voted for: ${result.optionText}`,
      pollTitle: result.pollTitle
    });

  } catch (error: any) {
    console.error('[VOTE_ERROR]', error);

    // Handle specific error types
    const errorMap: Record<string, { status: number; message: string }> = {
      'POLL_NOT_FOUND': { status: 404, message: 'Poll not found' },
      'POLL_CLOSED': { status: 403, message: 'This poll is closed' },
      'POLL_EXPIRED': { status: 403, message: 'This poll has expired' },
      'INVALID_OPTION': { status: 400, message: 'Invalid option selected' },
      'ALREADY_VOTED': { status: 409, message: 'You have already voted in this poll' }
    };

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('pollId', 'userId')) {
      return NextResponse.json(
        { error: 'You have already voted in this poll' },
        { status: 409 }
      );
    }

    const mappedError = errorMap[error.message];
    if (mappedError) {
      return NextResponse.json(
        { error: mappedError.message },
        { status: mappedError.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user has voted
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    const pollId = params.id;
    let hasVoted = false;
    let selectedOption = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (user) {
        const vote = await prisma.vote.findUnique({
          where: {
            pollId_userId: {
              pollId,
              userId: user.id
            }
          },
          include: { option: true }
        });

        hasVoted = !!vote;
        selectedOption = vote?.option;
      }
    } else if (deviceId) {
      // Check guest vote
      const vote = await prisma.vote.findFirst({
        where: {
          pollId,
          userId: null,
          metadata: {
            path: ['deviceId'],
            equals: deviceId
          }
        },
        include: { option: true }
      });

      hasVoted = !!vote;
      selectedOption = vote?.option;
    }

    return NextResponse.json({
      hasVoted,
      selectedOption: selectedOption ? {
        id: selectedOption.id,
        text: selectedOption.text
      } : null
    });

  } catch (error) {
    console.error('[VOTE_CHECK_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}