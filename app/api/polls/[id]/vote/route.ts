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

    // ── Load poll ─────────────────────────────────────────────────────────────
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

    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (poll.status === "CLOSED") return NextResponse.json({ error: "This poll is closed" }, { status: 403 });
    if (poll.endDate && new Date(poll.endDate) < new Date())
      return NextResponse.json({ error: "This poll has ended" }, { status: 403 });
    if (!optionId) return NextResponse.json({ error: "optionId is required" }, { status: 400 });
    if (!poll.options.find((o) => o.id === optionId))
      return NextResponse.json({ error: "Invalid option for this poll" }, { status: 400 });

    // ── Resolve userId ────────────────────────────────────────────────────────
    let userId: string | null = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = user?.id ?? null;
    }

    // ── PHYSICAL TICKET VOTING ────────────────────────────────────────────────
    // Each paid ticket = 1 vote. Voter supplies the QR/ID printed on their ticket.
    // The same ticket can only vote once per poll. Someone with 3 tickets gets 3 votes.
    if (poll.requiresTicket) { 
      if (!ticketCode?.trim()) {
        return NextResponse.json(
          { error: "This poll requires a ticket ID. Enter the code printed on your ticket." },
          { status: 403 }
        );
      }

      const ticket = await prisma.ticketInstance.findUnique({
        where: { qrCode: ticketCode.trim() },
        include: {
          ticketType: { select: { eventId: true } },
          votes: {
            where: { pollId }, // has THIS ticket already voted on THIS poll?
            select: { id: true },
          },
        },
      });

      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket not found. Double-check the ID on your ticket." },
          { status: 404 }
        );
      }

      // Must belong to the linked event if poll specifies one
      if (poll.eventId && ticket.ticketType.eventId !== poll.eventId) {
        return NextResponse.json(
          { error: "This ticket is not valid for this poll's event." },
          { status: 403 }
        );
      }

      // Must be a paid ticket
      if (ticket.status !== "PAID" && ticket.status !== "USED") {
        return NextResponse.json(
          { error: "Only paid tickets can be used to vote." },
          { status: 403 }
        );
      }

      // This ticket has already voted on this poll
      if (ticket.votes.length > 0) {
        return NextResponse.json(
          { error: "This ticket has already been used to vote on this poll. Use a different ticket." },
          { status: 409 }
        );
      }

      // ✅ Valid — cast the vote linked to this ticket
      const vote = await prisma.vote.create({
        data: {
          pollId,
          optionId,
          userId,               // null if guest voter
          ticketInstanceId: ticket.id,
        },
      });

      return NextResponse.json(
        { success: true, voteId: vote.id, ...(await buildResults(pollId)) },
        { status: 201 }
      );
    }

    // ── TOKEN_GATED: must have a paid digital order ───────────────────────────
    if (poll.pollType === "TOKEN_GATED") {
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "You must be logged in to vote on this poll" },
          { status: 401 }
        );
      }
      if (poll.eventId && userId) {
        const paidOrder = await prisma.order.findFirst({
          where: { userId, eventId: poll.eventId, status: "PAID" },
        });
        if (!paidOrder) {
          return NextResponse.json(
            { error: "This poll is only available to ticket holders for the linked event" },
            { status: 403 }
          );
        }
      }
    }

    // ── PUBLIC: one vote per logged-in user ───────────────────────────────────
    if (userId) {
      const existing = await prisma.vote.findFirst({ where: { pollId, userId } });
      if (existing) {
        return NextResponse.json({ error: "You have already voted on this poll" }, { status: 409 });
      }
    }

    const vote = await prisma.vote.create({
      data: { pollId, optionId, userId },
    });

    return NextResponse.json(
      { success: true, voteId: vote.id, ...(await buildResults(pollId)) },
      { status: 201 }
    );

  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}

// ── Shared result builder ─────────────────────────────────────────────────────
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