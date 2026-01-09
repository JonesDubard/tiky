import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    console.log('📝 Creating event with tickets:', body.tickets)
    
    // Validation
    if (!body.title || !body.date || !body.location) {
      return NextResponse.json(
        { error: 'Title, date, and location are required' },
        { status: 400 }
      )
    }

    // Validate ticket types
    if (!body.tickets || body.tickets.length === 0) {
      return NextResponse.json(
        { error: 'At least one ticket type is required' },
        { status: 400 }
      )
    }

    // Create event WITH imageUrl
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date),
        location: body.location,
        imageUrl: body.imageUrl || null, // Now this field exists!
        published: false,
        organizerId: user.id,
        // Create tickets along with event
        tickets: {
          create: body.tickets.map((t: any) => ({
            type: t.type || t.name,
            price: parseFloat(t.price),
            quantity: parseInt(t.quantity),
            userId: user.id
          }))
        }
      },
      include: {
        tickets: true
      }
    })

    console.log('✅ Event created with', event.tickets.length, 'tickets')
    
    return NextResponse.json({ 
      success: true, 
      event,
      message: 'Event created successfully' 
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    return NextResponse.json({ events })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}