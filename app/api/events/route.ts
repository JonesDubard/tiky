// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'

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
        organizer: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            tickets: true,
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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is admin
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Validate required fields
    const { title, date, location, price, tickets = [] } = body
    
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      )
    }
    
    // Generate a unique ticket ID prefix
    const ticketPrefix = `TIK-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Create event WITH tickets in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the event
      const event = await prisma.event.create({
        data: {
          title,
          description: body.description || '',
          date: new Date(date),
          location,
          price: price ? parseFloat(price) : 0,
          imageUrl: body.imageUrl || null,
          published: body.published || false,
          isFeatured: body.isFeatured || false,
          createdById: session.user.id,
          organizerId: body.organizerId || session.user.id
        }
      })
      
      // 2. Create tickets if provided
      const createdTickets = [];
      if (tickets && Array.isArray(tickets) && tickets.length > 0) {
        for (let i = 0; i < tickets.length; i++) {
          const ticketData = tickets[i];
          
          if (ticketData.type && ticketData.price !== undefined) {
            const ticket = await prisma.ticket.create({
              data: {
                ticketId: `${ticketPrefix}-${(i + 1).toString().padStart(3, '0')}`,
                type: ticketData.type,
                price: parseFloat(ticketData.price),
                quantity: parseInt(ticketData.quantity || 100),
                eventId: event.id,
                status: 'PENDING',
                qrCodeHash: `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              }
            })
            createdTickets.push(ticket);
          }
        }
      } else {
        // Create a default ticket if none provided
        const defaultTicket = await prisma.ticket.create({
          data: {
            ticketId: `${ticketPrefix}-001`,
            type: 'General Admission',
            price: price ? parseFloat(price) : 0,
            quantity: 100,
            eventId: event.id,
            status: 'PENDING',
            qrCodeHash: `qr-default-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
        })
        createdTickets.push(defaultTicket);
      }
      
      return { event, tickets: createdTickets };
    })
    
    return NextResponse.json({
      success: true,
      eventId: result.event.id,
      ticketCount: result.tickets.length,
      message: 'Event created successfully with tickets'
    })
    
  } catch (error) {
    console.error('POST /api/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}