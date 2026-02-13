import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if event exists and user has permission
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { createdById: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && event.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete event (cascades to ticketTypes, tickets, polls, etc.)
    await prisma.event.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EVENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { published, isFeatured, title, description, date, location } = body;

    // Check permission
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { createdById: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && event.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(published !== undefined && { published }),
        ...(isFeatured !== undefined && user.role === 'ADMIN' && { isFeatured }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) }),
        ...(location && { location })
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("[EVENT_UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}