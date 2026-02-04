// app/api/events/route.ts - UPDATED VERSION
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        tickets: true,
        _count: {
          select: { polls: true }
        }
      },
      orderBy: { date: "desc" }
    })
    
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      date, 
      location, 
      imageUrl, 
      isFeatured, 
      published,
      tickets 
    } = body

    // Validation
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate tickets
    if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return NextResponse.json(
        { error: "At least one ticket type is required" },
        { status: 400 }
      )
    }

    // Create event with tickets in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create event
      const event = await tx.event.create({
        data: {
          title,
          description,
          date: new Date(date),
          location,
          imageUrl,
          isFeatured: isFeatured || false,
          published: published || false,
          createdById: session.user.id,
        },
      })

      // Create tickets
      const createdTickets = await Promise.all(
        tickets.map(ticket =>
          tx.ticket.create({
            data: {
              type: ticket.type,
              price: parseFloat(ticket.price),
              quantity: parseInt(ticket.quantity),
              eventId: event.id,
              userId: session.user.id, // Admin who created it
            }
          })
        )
      )

      return { event, tickets: createdTickets }
    })

    return NextResponse.json(
      { 
        success: true,
        message: "Event created successfully",
        event: result.event,
        tickets: result.tickets
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}