// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from 'lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'ADMIN' && user.role !== 'ORGANIZER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await req.formData()

    const eventDataJson = formData.get('eventData') as string
    if (!eventDataJson) {
      return NextResponse.json({ error: 'No event data provided' }, { status: 400 })
    }

    const eventData = JSON.parse(eventDataJson)
    const { title, description, date, location, published, isFeatured, ticketTypes } = eventData

    if (!title || !date || !location || !ticketTypes?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let imageUrl = eventData.imageUrl || ''
    const imageFile = formData.get('image') as File | null

    if (imageFile) {
      if (!imageFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 })
      }

      const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const blob = await put(filename, imageFile, {
        access: 'public',
        contentType: imageFile.type,
      })

      imageUrl = blob.url
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        date: new Date(date),
        location,
        imageUrl,
        published: published !== undefined ? published : true,
        isFeatured: isFeatured || false,
        createdById: user.id,
        ticketTypes: {
          create: ticketTypes.map((ticket: { name: string; price: string; quantity: string; maxPerOrder?: number; description?: string }) => ({
            name: ticket.name,
            price: parseFloat(ticket.price) || 0,
            quantity: parseInt(ticket.quantity) || 0,
            maxPerOrder: ticket.maxPerOrder || 5,
            description: ticket.description || ''
          }))
        }
      },
      include: {
        ticketTypes: true,
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      event,
      message: 'Event created successfully'
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const code = (error as NodeJS.ErrnoException).code
    console.error('[EVENT_CREATE_ERROR]', { message, code })
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}