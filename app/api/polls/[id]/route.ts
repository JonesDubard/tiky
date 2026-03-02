// app/api/polls/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const body = await req.json();
    const { title, description, pollType, status, endDate, eventId, isFeatured, options } = body;

    const poll = await prisma.poll.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        pollType,
        status,
        endDate: endDate ? new Date(endDate) : null,
        eventId: pollType === "TOKEN_GATED" ? (eventId || null) : null,
        isFeatured: isFeatured ?? false,
      },
    });

    if (options && Array.isArray(options)) {
      type OptionInput = { id?: string; text: string; imageUrl?: string | null };
      const validOptions = (options as OptionInput[]).filter((o) => o.text?.trim());
      const incomingIds = validOptions.filter((o) => o.id).map((o) => o.id as string);

      await prisma.pollOption.deleteMany({
        where: { pollId: id, id: { notIn: incomingIds } },
      });

      for (const o of validOptions) {
        const text = o.text.trim();
        const imageUrl = o.imageUrl ?? null;
        if (o.id) {
          await prisma.pollOption.update({
            where: { id: o.id },
            data: { text, imageUrl },
          });
        } else {
          await prisma.pollOption.create({
            data: { pollId: id, text, imageUrl },
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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