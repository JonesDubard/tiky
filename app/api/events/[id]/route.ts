// app/api/events/[id]/route.ts - COMPLETE VERSION
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// GET - Get single event (public or admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Public can view published events, admins can view all
    const whereCondition = session?.user?.role === "ADMIN" 
      ? { id: params.id }
      : { 
          id: params.id,
          published: true 
        }

    const event = await prisma.event.findUnique({
      where: whereCondition,
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        tickets: true
      },
      deletedAt: null
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    )
  }
}

// PUT - Update event (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, date, location, imageUrl, isFeatured, published } = body

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: title || existingEvent.title,
        description: description || existingEvent.description,
        date: date ? new Date(date) : existingEvent.date,
        location: location || existingEvent.location,
        imageUrl: imageUrl || existingEvent.imageUrl,
        isFeatured: isFeatured !== undefined ? isFeatured : existingEvent.isFeatured,
        published: published !== undefined ? published : existingEvent.published,
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Event updated successfully",
      event
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    )
  }
}

// DELETE - Delete event (admin only) - ADD THIS
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id }
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Delete event (cascade will delete related tickets)
    await prisma.event.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}