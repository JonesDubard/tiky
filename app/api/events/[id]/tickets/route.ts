// app/api/events/[id]/tickets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { eventId: params.id },
      orderBy: { price: "asc" }
    })
    
    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}