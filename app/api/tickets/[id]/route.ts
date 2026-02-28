// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log("Fetching ticket with ID:", id)

    const ticket = await prisma.ticketInstance.findUnique({
      where: { id },
      include: {
        ticketType: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                date: true,
                location: true,
                imageUrl: true,
              },
            },
          },
        },
        order: {
          include: {
            payments: {
              select: {
                paymentMethod: true,
                status: true,
                amount: true,
                currency: true,
              },
            },
          },
        },
      },
    })

    if (!ticket) {
      console.log("Ticket not found for ID:", id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    console.log("Ticket found:", ticket.id)

    const ticketData = {
      id: ticket.id,
      qrCode: ticket.qrCode,
      qrImage: ticket.qrImage,
      status: ticket.status,
      guestName: ticket.guestName,
      guestEmail: ticket.guestEmail,
      createdAt: ticket.createdAt.toISOString(),
      ticketType: {
        id: ticket.ticketType.id,
        name: ticket.ticketType.name,
        price: ticket.ticketType.price,
        description: ticket.ticketType.description,
      },
      event: {
        id: ticket.ticketType.event.id,
        title: ticket.ticketType.event.title,
        description: ticket.ticketType.event.description,
        date: ticket.ticketType.event.date?.toISOString(),
        location: ticket.ticketType.event.location,
        imageUrl: ticket.ticketType.event.imageUrl,
      },
      payment: ticket.order?.payments?.[0] ?? null,
    }

    return NextResponse.json(ticketData)
  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}