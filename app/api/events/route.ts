import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: new Date()
        }
      },
      orderBy: {
        date: "asc"
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("[EVENTS_GET]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
