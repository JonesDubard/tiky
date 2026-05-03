// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";

// ─── GET handler (list events) ──────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const publishedOnly = searchParams.get("published") === "true";

    const events = await prisma.event.findMany({
      where: {
        deletedAt: null,
        ...(publishedOnly && { published: true }),
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[EVENTS_LIST]", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// ─── POST handler (create event) ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await req.formData();

    const eventDataJson = formData.get("eventData") as string;
    if (!eventDataJson) {
      return NextResponse.json({ error: "No event data provided" }, { status: 400 });
    }

    const eventData = JSON.parse(eventDataJson);
    const { title, description, date, location, published, isFeatured, ticketTypes } = eventData;

    if (!title || !date || !location || !ticketTypes?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let imageUrl = eventData.imageUrl || "";
    const imageFile = formData.get("image") as File | null;

    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 });
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
      }

      // ── Compress with Sharp ──────────────────────────────────────────────
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const resizedBuffer = await sharp(buffer)
        .resize({ width: 1200, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

      const blob = await put(filename, resizedBuffer, {
        access: "public",
        contentType: "image/webp",
      });

      imageUrl = blob.url;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || "",
        date: new Date(date),
        location,
        imageUrl,
        published: published !== undefined ? published : true,
        isFeatured: isFeatured || false,
        createdById: user.id,
        ticketTypes: {
          create: ticketTypes.map((ticket: any) => ({
            name: ticket.name,
            price: parseFloat(ticket.price) || 0,
            quantity: parseInt(ticket.quantity) || 0,
            maxPerOrder: ticket.maxPerOrder || 5,
            description: ticket.description || "",
          })),
        },
      },
      include: {
        ticketTypes: true,
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, event, message: "Event created successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[EVENT_CREATE_ERROR]", { message });
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

// ─── PUT handler (update event) ─────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

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

    const event = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "ADMIN" && event.createdById !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let imageUrl = eventData.imageUrl ?? "";

    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 });
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
      }

      // ── Compress with Sharp ──────────────────────────────────────────────
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const resizedBuffer = await sharp(buffer)
        .resize({ width: 1200, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

      const blob = await put(filename, resizedBuffer, {
        access: "public",
        contentType: "image/webp",
      });

      imageUrl = blob.url;
    }

    const updatedEvent = await prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id },
        data: {
          title: eventData.title,
          description: eventData.description,
          date: eventData.date ? new Date(eventData.date) : undefined,
          location: eventData.location,
          imageUrl,
          published: eventData.published ?? false,
          isFeatured: eventData.isFeatured ?? false,
        },
      });

      if (eventData.ticketTypes && Array.isArray(eventData.ticketTypes)) {
        const existingTickets = await tx.ticketType.findMany({
          where: { eventId: id },
        });
        const incomingIds = eventData.ticketTypes
          .filter((t: any) => t.id)
          .map((t: any) => t.id as string);
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
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// ─── DELETE handler (soft delete event) ─────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "ADMIN" && event.createdById !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Event soft-deleted" });
  } catch (error) {
    console.error("[EVENT_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}