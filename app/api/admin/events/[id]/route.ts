import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        ticketTypes: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("[EVENT_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, date, location, imageUrl, published, isFeatured, ticketTypes } = body;

    // Check permissions
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { createdById: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && event.createdById !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update event with transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // Update event basic info
      const updated = await tx.event.update({
        where: { id: params.id },
        data: {
          title,
          description,
          date: new Date(date),
          location,
          imageUrl,
          published: published ?? false,
          isFeatured: isFeatured ?? false,
        },
      });

      // Handle ticket types if provided
      if (ticketTypes && Array.isArray(ticketTypes)) {
        // Get existing ticket types
        const existingTickets = await tx.ticketType.findMany({
          where: { eventId: params.id },
        });

        // Delete removed ticket types
        const incomingIds = ticketTypes.filter((t: any) => t.id).map((t: any) => t.id);
        const toDelete = existingTickets.filter((t) => !incomingIds.includes(t.id));
        
        for (const ticket of toDelete) {
          await tx.ticketType.delete({ where: { id: ticket.id } });
        }

        // Update or create ticket types
        for (const ticket of ticketTypes) {
          if (ticket.id) {
            // Update existing
            await tx.ticketType.update({
              where: { id: ticket.id },
              data: {
                name: ticket.name,
                price: parseFloat(ticket.price),
                quantity: parseInt(ticket.quantity),
              },
            });
          } else {
            // Create new
            await tx.ticketType.create({
              data: {
                name: ticket.name,
                price: parseFloat(ticket.price),
                quantity: parseInt(ticket.quantity),
                eventId: params.id,
              },
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("[EVENT_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: { createdById: true }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && event.createdById !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete event (cascades to ticketTypes, tickets, etc.)
    await prisma.event.delete({
      where: { id: params.id },
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