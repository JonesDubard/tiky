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
    const { title, date, location, price } = body
    
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      )
    }
    
    // Create event
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
    
    return NextResponse.json({
      success: true,
      eventId: event.id,
      message: 'Event created successfully'
    })
    
  } catch (error) {
    console.error('POST /api/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}