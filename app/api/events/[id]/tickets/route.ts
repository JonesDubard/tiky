// app/api/events/[id]/tickets/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Next.js 15: params is a Promise
) {
  try {
    const { id } = await params // ✅ Must be awaited

    const tickets = await prisma.ticketType.findMany({
      where: { eventId: id },
      orderBy: { price: "asc" },
      include: {
        event: {           // ✅ Include event so ticket.event.title works in CheckoutPage
          select: {
            title: true,
          },
        },
      },
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Full Prisma error:", error) // ✅ Was just logging generic message before
  return NextResponse.json(
    { error: "Failed to fetch tickets" },
    { status: 500 }
  )
  }
}