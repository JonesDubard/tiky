// app/api/events/route.ts - Updated for public access
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
        
      },
      include: {
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
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[EVENTS_API] Error:", error)
    return NextResponse.json([], { status: 200 })
  }
}
