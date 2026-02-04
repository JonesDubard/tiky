// app/api/polls/route.ts - UPDATED
import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ]
      },
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
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 6
    })

    // Transform data for LivePolls component
    const transformedPolls = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description || "",
      endDate: poll.endDate?.toISOString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days if no endDate
      options: poll.options.map(option => ({
        id: option.id,
        text: option.text,
        votes: option._count.votes
      })),
      totalVotes: poll._count.votes
    }))

    return NextResponse.json(transformedPolls)
  } catch (error) {
    console.error("[POLLS_API] Error:", error)
    return NextResponse.json([])
  }
}