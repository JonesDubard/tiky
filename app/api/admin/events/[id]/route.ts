import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { put } from "@vercel/blob"

export async function GET(req: NextRequest) {
  
  try {
    console.log("🔥 GET /api/admin/events HIT");
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let eventData: {
      title?: string
      description?: string
      date?: string
      location?: string
      imageUrl?: string
      published?: boolean
      isFeatured?: boolean
      ticketTypes?: { id?: string; name: string; price: string; quantity: string }[]
    }
    let imageFile: File | null = null

    const contentType = req.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const eventDataStr = formData.get("eventData") as string
      if (!eventDataStr) {
        return NextResponse.json({ error: "Missing eventData" }, { status: 400 })
      }
      eventData = JSON.parse(eventDataStr)
      imageFile = formData.get("image") as File | null
    } else {
      eventData = await req.json()
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user || (user.role !== "ADMIN" && event.createdById !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let imageUrl = eventData.imageUrl ?? ""

    if (imageFile) {
      if (!imageFile.type.startsWith("image/")) {
        return NextResponse.json({ error: "File must be an image" }, { status: 400 })
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 })
      }

      const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg"
      const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const blob = await put(filename, imageFile, {
        access: "public",
        contentType: imageFile.type,
      })

      imageUrl = blob.url
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
      })

      if (eventData.ticketTypes && Array.isArray(eventData.ticketTypes)) {
        const existingTickets = await tx.ticketType.findMany({
          where: { eventId: id },
        })
        const incomingIds = eventData.ticketTypes
          .filter((t) => t.id)
          .map((t) => t.id as string)
        const toDelete = existingTickets.filter((t) => !incomingIds.includes(t.id))

        for (const ticket of toDelete) {
          await tx.ticketType.delete({ where: { id: ticket.id } })
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
            })
          } else {
            await tx.ticketType.create({
              data: {
                name: ticket.name,
                price: parseFloat(ticket.price),
                quantity: parseInt(ticket.quantity),
                eventId: id,
              },
            })
          }
        }
      }

      return updated
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("[EVENT_PUT]", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!user || (user.role !== "ADMIN" && event.createdById !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true, message: "Event soft-deleted" })
  } catch (error) {
    console.error("[EVENT_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}