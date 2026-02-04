// app/api/events/route.ts - FIXED IMPORT
import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"  // FIXED PATH

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        isFeatured: true,
        date: {
          gte: new Date()
        }
      },
      include: {
        organizer: {
          select: {
            name: true
          }
        },
        tickets: {
          select: {
            type: true,
            price: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 6
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[EVENTS_API] Error:", error)
    return NextResponse.json([], { status: 200 })
  }
}