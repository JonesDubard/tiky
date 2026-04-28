// app/api/polls/[id]/remaining-votes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get poll and its linked event
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      select: { eventId: true, pollType: true, requiresTicket: true },
    });
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // For non-token polls, remaining votes is irrelevant – user just votes once.
    if (poll.pollType !== "TOKEN_GATED" || !poll.requiresTicket || !poll.eventId) {
      return NextResponse.json({ remaining: null }); // not applicable
    }

    // Count paid tickets the user has for the linked event
    const paidTicketsCount = await prisma.ticketInstance.count({
      where: {
        status: { in: ["PAID", "USED"] }, // USED tickets have been scanned but still valid for voting?
        ticketType: { eventId: poll.eventId },
        order: { userId: user.id },
      },
    });

    // Count votes already cast by this user on this poll (each vote consumes a ticket)
    const votesUsed = await prisma.vote.count({
      where: {
        pollId,
        userId: user.id,
        ticketInstanceId: { not: null }, // only ticket-backed votes
      },
    });

    const remaining = Math.max(0, paidTicketsCount - votesUsed);
    return NextResponse.json({ remaining, totalTickets: paidTicketsCount });
  } catch (error) {
    console.error("Remaining votes error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}