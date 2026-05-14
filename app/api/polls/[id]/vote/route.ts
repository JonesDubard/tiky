// app/api/polls/[id]/vote/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const body = await req.json()
    const { optionId, deviceId } = body

    // 1. Load poll
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      select: {
        id: true,
        status: true,
        endDate: true,
        options: { select: { id: true } },
      },
    })

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    }

    // 2. Poll active?
    if (poll.status !== "ACTIVE") {
      return NextResponse.json({ error: "Poll is closed" }, { status: 403 })
    }
    if (poll.endDate && new Date(poll.endDate) < new Date()) {
      return NextResponse.json({ error: "Poll has ended" }, { status: 403 })
    }

    // 3. Validate option
    if (!optionId || !poll.options.some((o) => o.id === optionId)) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 })
    }

    // 4. Duplicate check — deviceId is the only gate (guests welcome)
    if (!deviceId) {
      return NextResponse.json(
        { error: "A device ID is required to vote" },
        { status: 400 }
      )
    }

    const existing = await prisma.vote.findFirst({
      where: { pollId, deviceId },
    })
    if (existing) {
      return NextResponse.json(
        { error: "You have already voted on this poll" },
        { status: 409 }
      )
    }

    // 5. Create vote
    await prisma.vote.create({
      data: { pollId, optionId, deviceId },
    })

    // 6. Return fresh results using _count.votes (single source of truth)
    const options = await prisma.pollOption.findMany({
      where: { pollId },
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: "asc" },
    })

    const totalVotes = options.reduce((sum, o) => sum + o._count.votes, 0)

    return NextResponse.json({
      success: true,
      results: options.map((o) => ({
        id: o.id,
        text: o.text,
        imageUrl: o.imageUrl ?? null,
        votes: o._count.votes,
        percentage:
          totalVotes > 0 ? Math.round((o._count.votes / totalVotes) * 100) : 0,
      })),
      totalVotes,
    }, { status: 201 })

  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}