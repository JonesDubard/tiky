// app/api/polls/[id]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: pollId } = await params;
    const session = await getServerSession(authOptions);

    // --- Fetch poll ---
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      include: {
        options: { select: { id: true } },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.status === "CLOSED") {
      return NextResponse.json({ error: "This poll is closed" }, { status: 403 });
    }

    if (poll.endDate && new Date(poll.endDate) < new Date()) {
      return NextResponse.json({ error: "This poll has ended" }, { status: 403 });
    }

    // --- Auth check for PAID/TOKEN_GATED polls ---
    if (poll.pollType === "PAID") {
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "You must be logged in to vote on this poll" },
          { status: 401 }
        );
      }

      if (poll.eventId) {
        // Check user has a PAID ticket/order for the linked event
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });

        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const paidOrder = await prisma.order.findFirst({
          where: {
            userId: user.id,
            eventId: poll.eventId,
            status: "PAID",
          },
        });

        if (!paidOrder) {
          return NextResponse.json(
            {
              error:
                "This poll is only available to ticket holders for the linked event",
            },
            { status: 403 }
          );
        }
      }
    }

    // --- Parse body ---
    const body = await req.json();
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json({ error: "optionId is required" }, { status: 400 });
    }

    // Validate optionId belongs to this poll
    const validOption = poll.options.find((o) => o.id === optionId);
    if (!validOption) {
      return NextResponse.json(
        { error: "Invalid option for this poll" },
        { status: 400 }
      );
    }

    // --- Duplicate vote check ---
    let userId: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }

    if (userId) {
      const existingVote = await prisma.vote.findFirst({
        where: { pollId, userId },
      });

      if (existingVote) {
        return NextResponse.json(
          { error: "You have already voted on this poll" },
          { status: 409 }
        );
      }
    }

    // --- Cast vote ---
    const vote = await prisma.vote.create({
      data: {
        pollId,
        optionId,
        userId,
      },
    });

    // Return updated results immediately
    const updatedOptions = await prisma.pollOption.findMany({
      where: { pollId },
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: "asc" },
    });

    const totalVotes = updatedOptions.reduce(
      (sum, o) => sum + o._count.votes,
      0
    );

    const results = updatedOptions.map((o) => ({
      id: o.id,
      text: o.text,
      votes: o._count.votes,
      percentage:
        totalVotes > 0 ? Math.round((o._count.votes / totalVotes) * 100) : 0,
    }));

    return NextResponse.json(
      { success: true, voteId: vote.id, results, totalVotes },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}