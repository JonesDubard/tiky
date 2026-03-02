// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'

// GET all events (for admin)
// GET all events (for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const events = await prisma.event.findMany({
      where: {
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        // ❌ removed invalid 'organizer' relation
        _count: {
          select: {
            ticketTypes: true,  // ✅ changed from 'tickets' to 'ticketTypes'
            polls: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(events)
    
  } catch (error) {
    console.error('GET /api/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new event
// POST create new event - UPDATED VERSION
// app/api/events/route.ts – POST (corrected)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, date, location, price, tickets = [] } = body

    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (prisma) => {
      // Create the event
      const event = await prisma.event.create({
        data: {
          title,
          description: body.description || '',
          date: new Date(date),
          location,
          imageUrl: body.imageUrl || null,
          published: body.published || false,
          isFeatured: body.isFeatured || false,
          createdById: session.user.id,
        },
      })

      // Create ticket types if provided
      const createdTicketTypes = []
      if (tickets && Array.isArray(tickets) && tickets.length > 0) {
        for (const ticketData of tickets) {
          if (ticketData.type && ticketData.price !== undefined) {
            const ticketType = await prisma.ticketType.create({
              data: {
                name: ticketData.type,                 // map 'type' to 'name'
                price: parseFloat(ticketData.price),
                quantity: parseInt(ticketData.quantity || 100),
                eventId: event.id,
                // optional fields can be added if present in ticketData
                maxPerOrder: ticketData.maxPerOrder || 5,
                salesStart: ticketData.salesStart ? new Date(ticketData.salesStart) : null,
                salesEnd: ticketData.salesEnd ? new Date(ticketData.salesEnd) : null,
                description: ticketData.description || null,
              },
            })
            createdTicketTypes.push(ticketType)
          }
        }
      } else {
        // Create a default ticket type if none provided
        const defaultTicketType = await prisma.ticketType.create({
          data: {
            name: 'General Admission',
            price: price ? parseFloat(price) : 0,
            quantity: 100,
            eventId: event.id,
            maxPerOrder: 5,
          },
        })
        createdTicketTypes.push(defaultTicketType)
      }

      return { event, ticketTypes: createdTicketTypes }
    })

    return NextResponse.json({
      success: true,
      eventId: result.event.id,
      ticketTypeCount: result.ticketTypes.length,
      message: 'Event created successfully with ticket types',
    })
  } catch (error) {
    console.error('POST /api/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}