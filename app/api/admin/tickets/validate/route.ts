// app/api/admin/tickets/validate/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { qrCode } = await req.json()

    if (!qrCode) {
      return NextResponse.json({ error: "QR code is required" }, { status: 400 })
    }

    // Find ticket by qrCode value
    const ticket = await prisma.ticketInstance.findFirst({
      where: { qrCode },
      include: {
        ticketType: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                date: true,
                location: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })

    if (!ticket) {
      return NextResponse.json(
        { valid: false, error: "Ticket not found" },
        { status: 404 }
      )
    }

    if (ticket.status === "USED") {
      return NextResponse.json({
        valid: false,
        alreadyUsed: true,
        error: "Ticket has already been used",
        validatedAt: ticket.validatedAt,
        ticket: {
          id: ticket.id,
          event: ticket.ticketType.event.title,
          ticketType: ticket.ticketType.name,
          holder: ticket.order?.user?.name || ticket.guestName || "Guest",
        },
      })
    }

    if (ticket.status === "CANCELLED" || ticket.status === "EXPIRED") {
      return NextResponse.json({
        valid: false,
        error: `Ticket is ${ticket.status.toLowerCase()}`,
        ticket: {
          id: ticket.id,
          event: ticket.ticketType.event.title,
          ticketType: ticket.ticketType.name,
        },
      })
    }

    // ✅ Mark as USED
    const updated = await prisma.ticketInstance.update({
      where: { id: ticket.id },
      data: {
        status: "USED",
        validatedAt: new Date(),
      },
    })

    return NextResponse.json({
      valid: true,
      ticket: {
        id: ticket.id,
        event: ticket.ticketType.event.title,
        eventDate: ticket.ticketType.event.date,
        location: ticket.ticketType.event.location,
        ticketType: ticket.ticketType.name,
        price: ticket.ticketType.price,
        holder: ticket.order?.user?.name || ticket.guestName || "Guest",
        email: ticket.order?.user?.email || ticket.guestEmail || null,
        validatedAt: updated.validatedAt,
      },
    })
  } catch (error) {
    console.error("Ticket validation error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}