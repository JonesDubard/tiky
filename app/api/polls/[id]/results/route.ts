// app/api/polls/[id]/results/route.ts
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

    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const totalVotes = poll._count.votes;

    const results = poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      imageUrl: option.imageUrl ?? null,
      votes: option._count.votes,
      percentage:
        totalVotes > 0
          ? Math.round((option._count.votes / totalVotes) * 100)
          : 0,
    }));

    const session = await getServerSession(authOptions);
    let userVotedOptionId: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (user) {
        const existingVote = await prisma.vote.findFirst({
          where: { pollId, userId: user.id },
          select: { optionId: true },
        });
        userVotedOptionId = existingVote?.optionId ?? null;
      }
    }

    return NextResponse.json({
      pollId,
      totalVotes,
      results,
      userVotedOptionId,
      status: poll.status,
      endDate: poll.endDate,
    });
  } catch (error) {
    console.error("Results fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}