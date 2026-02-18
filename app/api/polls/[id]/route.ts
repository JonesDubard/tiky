// app/api/polls/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth';

// GET a single poll by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const { id } = params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Check if current user has voted (if logged in)
    let userVote = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (user) {
        const vote = await prisma.vote.findUnique({
          where: {
            pollId_userId: {
              pollId: id,
              userId: user.id
            }
          },
          include: {
            option: true
          }
        });
        userVote = vote;
      }
    }

    return NextResponse.json({
      ...poll,
      userVote: userVote ? {
        id: userVote.id,
        optionId: userVote.optionId,
        optionText: userVote.option.text,
        createdAt: userVote.createdAt
      } : null
    });

  } catch (error) {
    console.error('[POLL_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    );
  }
}

// UPDATE a poll
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { title, description, pollType, status, endDate, options } = body;

    // Check if poll exists and user is creator
    const existingPoll = await prisma.poll.findUnique({
      where: { id },
      include: { options: true }
    });

    if (!existingPoll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Get user to check ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || existingPoll.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this poll' },
        { status: 403 }
      );
    }

    // Update poll with transaction
    const updatedPoll = await prisma.$transaction(async (tx) => {
      // Update poll basic info
      const poll = await tx.poll.update({
        where: { id },
        data: {
          title,
          description,
          pollType,
          status,
          endDate: endDate ? new Date(endDate) : null
        }
      });

      // Update options if provided
      if (options && options.length > 0) {
        // Delete old options
        await tx.option.deleteMany({
          where: { pollId: id }
        });

        // Create new options
        await tx.option.createMany({
          data: options.map((opt: any) => ({
            text: opt.text,
            imageUrl: opt.imageUrl,
            pollId: id
          }))
        });
      }

      // Return updated poll with options
      return tx.poll.findUnique({
        where: { id },
        include: {
          options: true,
          _count: {
            select: { votes: true }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      poll: updatedPoll,
      message: 'Poll updated successfully'
    });

  } catch (error: any) {
    console.error('[POLL_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    );
  }
}

// DELETE a poll
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if poll exists
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Get user to check ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Check if user is admin or poll creator
    const isAdmin = user?.role === 'ADMIN';
    if (!isAdmin && poll.creatorId !== user?.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this poll' },
        { status: 403 }
      );
    }

    // Check if poll has votes
    if (poll._count.votes > 0) {
      // Instead of deleting, just mark as closed
      const closedPoll = await prisma.poll.update({
        where: { id },
        data: { status: 'CLOSED' }
      });

      return NextResponse.json({
        success: true,
        poll: closedPoll,
        message: 'Poll has been closed (votes exist)'
      });
    }

    // No votes, safe to delete
    await prisma.poll.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Poll deleted successfully'
    });

  } catch (error) {
    console.error('[POLL_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 }
    );
  }
}

// PATCH for partial updates (e.g., toggle status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status, isFeatured } = body;

    // Check if poll exists
    const poll = await prisma.poll.findUnique({
      where: { id }
    });

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Check if user is admin or poll creator
    const isAdmin = user?.role === 'ADMIN';
    if (!isAdmin && poll.creatorId !== user?.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this poll' },
        { status: 403 }
      );
    }

    // Update poll
    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(isFeatured !== undefined && { isFeatured })
      },
      include: {
        options: true,
        _count: {
          select: { votes: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      poll: updatedPoll,
      message: 'Poll updated successfully'
    });

  } catch (error) {
    console.error('[POLL_PATCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    );
  }
}