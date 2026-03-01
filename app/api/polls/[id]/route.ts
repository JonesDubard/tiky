// app/api/polls/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

// GET /api/polls/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const poll = await prisma.poll.findUnique({
      where: { id, deletedAt: null },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { votes: true, options: true } },
        event: { select: { id: true, title: true } },
        creator: { select: { name: true, email: true } },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("Poll fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
  }
}

// PUT /api/polls/[id] — update (admin/organizer only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.poll.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, createdById: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (user.role === "ORGANIZER" && existing.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, pollType, status, endDate, eventId, isFeatured, options } = body;

    // Update poll metadata
    const poll = await prisma.poll.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        pollType,
        status,
        endDate: endDate ? new Date(endDate) : null,
        eventId: eventId || null,
        isFeatured: isFeatured ?? false,
      },
    });

    // Handle options: upsert existing, create new, delete removed
    if (options && Array.isArray(options)) {
      const validOptions = options.filter((o: { text: string }) => o.text?.trim());

      const incomingIds = validOptions
        .filter((o: { id?: string }) => o.id)
        .map((o: { id: string }) => o.id);

      // Delete options that were removed
      await prisma.pollOption.deleteMany({
        where: {
          pollId: id,
          id: { notIn: incomingIds },
        },
      });

      // Upsert each option
      for (const option of validOptions) {
        if (option.id) {
          await prisma.pollOption.update({
            where: { id: option.id },
            data: { text: option.text.trim() },
          });
        } else {
          await prisma.pollOption.create({
            data: { pollId: id, text: option.text.trim() },
          });
        }
      }
    }

    return NextResponse.json({ poll, id: poll.id });
  } catch (error) {
    console.error("Poll update error:", error);
    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}

// DELETE /api/polls/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.poll.findUnique({
      where: { id, deletedAt: null },
      select: { createdById: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (user.role === "ORGANIZER" && existing.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.poll.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Poll delete error:", error);
    return NextResponse.json({ error: "Failed to delete poll" }, { status: 500 });
  }
}