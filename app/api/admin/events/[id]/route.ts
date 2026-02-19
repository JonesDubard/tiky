import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id} = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let eventData: any;
    let imageFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const eventDataStr = formData.get("eventData") as string;
      if (!eventDataStr) {
        return NextResponse.json({ error: "Missing eventData" }, { status: 400 });
      }
      eventData = JSON.parse(eventDataStr);
      imageFile = formData.get("image") as File | null;
    } else {
      eventData = await req.json();
    }

    // Check permissions (same as before)
    const event = await prisma.event.findUnique({
      where: { id },
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

    // If an image file was uploaded, you need to process it (e.g., upload to cloud storage)
    // For now, assume you have a utility function `uploadImage` that returns a URL.
    // If you don't have one, you can keep the existing imageUrl from eventData.
    let imageUrl = eventData.imageUrl;
    if (imageFile) {
      // Implement your image upload logic here, e.g.:
      // imageUrl = await uploadImage(imageFile);
      // For now, we'll keep the existing URL – you'll need to add actual upload.
    }

    // Update event with transaction
    const updatedEvent = await prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id },
        data: {
          title: eventData.title,
          description: eventData.description,
          date: new Date(eventData.date),
          location: eventData.location,
          imageUrl,
          published: eventData.published ?? false,
          isFeatured: eventData.isFeatured ?? false,
        },
      });

      // Handle ticket types (same as before)
      if (eventData.ticketTypes && Array.isArray(eventData.ticketTypes)) {
        const existingTickets = await tx.ticketType.findMany({
          where: { id },
        });
        const incomingIds = eventData.ticketTypes.filter((t: any) => t.id).map((t: any) => t.id);
        const toDelete = existingTickets.filter((t) => !incomingIds.includes(t.id));
        for (const ticket of toDelete) {
          await tx.ticketType.delete({ where: { id: ticket.id } });
        }
        for (const ticket of eventData.ticketTypes) {
          if (ticket.id) {
            await tx.ticketType.update({
              where: { id: ticket.id },
              data: {
                name: ticket.name,
                price: parseFloat(ticket.price),
                quantity: parseInt(ticket.quantity),
              },
            });
          } else {
            await tx.ticketType.create({
              data: {
                name: ticket.name,
                price: parseFloat(ticket.price),
                quantity: parseInt(ticket.quantity),
                eventId: id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions (same as before)
    const event = await prisma.event.findUnique({
      where: { id },
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

    // ✅ Soft delete: set deletedAt instead of removing the record
    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: "Event soft-deleted" });
  } catch (error) {
    console.error("[EVENT_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}