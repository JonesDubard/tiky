import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pollId } = await params;
  const session = await getServerSession(authOptions);

  const poll = await prisma.poll.findUnique({
    where: { id: pollId, deletedAt: null },
    select: {
      status: true,
      endDate: true,
      pollType: true,
      eventId: true,
      requiresTicket: true,
    },
  });

  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });

  const now = new Date();
  const isActive = poll.status === "ACTIVE" && (!poll.endDate || new Date(poll.endDate) > now);

  let canVote = false;
  let reason: string | null = null;
  let requiredAction: "login" | "buy_ticket" | "enter_code" | null = null;

  if (!isActive) {
    reason = "Poll is not active";
  } else if (!session?.user?.email) {
    reason = "Authentication required";
    requiredAction = "login";
  } else {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      reason = "User not found";
      requiredAction = "login";
    } else {
      const existingVote = await prisma.vote.findFirst({
        where: { pollId, userId: user.id },
      });
      if (existingVote) {
        reason = "Already voted";
      } else if (poll.pollType === "TOKEN_GATED") {
        if (poll.requiresTicket) {
          reason = "Physical ticket required";
          requiredAction = "enter_code";
        } else if (!poll.eventId) {
          reason = "No event linked";
        } else {
          const paidOrder = await prisma.order.findFirst({
            where: { userId: user.id, eventId: poll.eventId, status: "COMPLETED" },
          });
          if (!paidOrder) {
            reason = "No valid ticket";
            requiredAction = "buy_ticket";
          } else {
            canVote = true;
          }
        }
      } else {
        canVote = true;
      }
    }
  }

  return NextResponse.json({
    canVote,
    reason,
    requiredAction,
    eventId: poll.eventId,
  });
}