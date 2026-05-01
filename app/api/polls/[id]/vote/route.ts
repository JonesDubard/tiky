import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { optionId, ticketCode } = body;

    // 1. Authentication
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "You must be logged in to vote." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "Account not found." },
        { status: 401 }
      );
    }

    // 2. Load poll
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      select: {
        id: true,
        status: true,
        endDate: true,
        pollType: true,
        eventId: true,
        requiresTicket: true,
        options: { select: { id: true } },
      },
    });

    if (!poll) {
      return NextResponse.json(
        { error: "POLL_NOT_FOUND", message: "Poll not found." },
        { status: 404 }
      );
    }

    // 3. Poll active?
    const now = new Date();
    if (poll.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "POLL_CLOSED", message: "This poll is closed." },
        { status: 403 }
      );
    }
    if (poll.endDate && new Date(poll.endDate) < now) {
      return NextResponse.json(
        { error: "POLL_ENDED", message: "This poll has ended." },
        { status: 403 }
      );
    }

    // 4. Validate option
    if (!optionId) {
      return NextResponse.json(
        { error: "MISSING_OPTION", message: "No option selected." },
        { status: 400 }
      );
    }
    if (!poll.options.some((o) => o.id === optionId)) {
      return NextResponse.json(
        { error: "INVALID_OPTION", message: "Invalid option for this poll." },
        { status: 400 }
      );
    }

    // ── 5. Uniqueness & eligibility ────────────────────────────────────────
    if (poll.pollType === "PUBLIC") {
      // One vote per user
      const existing = await prisma.vote.findFirst({
        where: { pollId, userId: user.id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "ALREADY_VOTED", message: "You have already voted on this poll." },
          { status: 409 }
        );
      }
    } else if (poll.pollType === "TOKEN_GATED") {
      // Must provide a ticket code
      if (!ticketCode?.trim()) {
        return NextResponse.json(
          { error: "TICKET_REQUIRED", message: "A ticket code is required to vote in this poll." },
          { status: 403 }
        );
      }

      const ticket = await prisma.ticketInstance.findUnique({
        where: { qrCode: ticketCode.trim() },
        include: {
          ticketType: { select: { eventId: true } },
          votes: { where: { pollId } },
          order: { select: { userId: true } },
        },
      });

      if (!ticket) {
        return NextResponse.json(
          { error: "INVALID_TICKET", message: "Ticket not found." },
          { status: 404 }
        );
      }

      // Check event match
      if (poll.eventId && ticket.ticketType.eventId !== poll.eventId) {
        return NextResponse.json(
          { error: "WRONG_EVENT", message: "This ticket is not for the linked event." },
          { status: 403 }
        );
      }

      // Ticket must be paid
      if (ticket.status !== "PAID" && ticket.status !== "USED") {
        return NextResponse.json(
          { error: "TICKET_NOT_PAID", message: "Only paid tickets can vote." },
          { status: 403 }
        );
      }

      // One vote per ticket
      if (ticket.votes.length > 0) {
        return NextResponse.json(
          { error: "TICKET_ALREADY_USED", message: "This ticket has already voted on this poll." },
          { status: 409 }
        );
      }

      // Create vote linked to ticket
      const vote = await prisma.vote.create({
        data: {
          pollId,
          optionId,
          userId: user.id,
          ticketInstanceId: ticket.id,
        },
      });

      const results = await buildResults(pollId);
      return NextResponse.json(
        { success: true, voteId: vote.id, ...results },
        { status: 201 }
      );
    }

    // ── Create vote for PUBLIC polls ─────────────────────────────────────
    const vote = await prisma.vote.create({
      data: {
        pollId,
        optionId,
        userId: user.id,
      },
    });

    const results = await buildResults(pollId);
    return NextResponse.json(
      { success: true, voteId: vote.id, ...results },
      { status: 201 }
    );
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

async function buildResults(pollId: string) {
  const options = await prisma.pollOption.findMany({
    where: { pollId },
    include: { _count: { select: { votes: true } } },
    orderBy: { createdAt: "asc" },
  });
  const totalVotes = options.reduce((sum, o) => sum + o._count.votes, 0);
  return {
    results: options.map((o) => ({
      id: o.id,
      text: o.text,
      imageUrl: o.imageUrl ?? null,
      votes: o._count.votes,
      percentage: totalVotes > 0 ? Math.round((o._count.votes / totalVotes) * 100) : 0,
    })),
    totalVotes,
  };
}