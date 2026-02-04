import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Add authentication - polls need a creator
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
    
    console.log('📝 Creating poll with options:', body.options)
    
    // Validation
    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    if (!body.options || body.options.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 options are required' },
        { status: 400 }
      )
    }

    // Create poll WITH options
    const poll = await prisma.poll.create({
      data: {
        title: body.title,
        description: body.description || null,
        type: body.type,
        status: 'ACTIVE',
        endDate: body.endDate ? new Date(body.endDate) : null,
        // isFeatured: body.isFeatured || false, // ← REMOVED (field doesn't exist)
        creatorId: user.id, // ← ADDED: required field
        // Create options along with poll
        options: {
          create: body.options.map((opt: any) => ({
            text: opt.text,
            imageUrl: opt.imageUrl || null
          }))
        }
      },
      include: {
        options: true // Return options in response
      }
    })

    console.log('✅ Poll created with', poll.options.length, 'options')
    
    return NextResponse.json({ 
      success: true, 
      poll,
      message: 'Poll created successfully' 
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to create poll' },
      { status: 500 }
    )
  }
}

// GET endpoint for listing polls
export async function GET() {
  try {
    const polls = await prisma.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        options: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: { votes: true }
        }
      }
    })
    return NextResponse.json({ polls })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}