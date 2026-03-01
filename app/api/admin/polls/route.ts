// app/api/admin/polls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { title, description, pollType, status, isFeatured, endDate, eventId, options } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validOptions = (options ?? []).filter((o: { text?: string } | string) =>
      typeof o === "string" ? o.trim() : o?.text?.trim()
    );

    if (validOptions.length < 2) {
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    }

    const poll = await prisma.poll.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        pollType: pollType || "FREE",
        status: status || "ACTIVE",
        isFeatured: isFeatured ?? false,
        endDate: endDate ? new Date(endDate) : null,
        eventId: eventId || null,
        createdById: user.id,
        options: {
          create: validOptions.map((o: { text?: string } | string) => ({
            text: (typeof o === "string" ? o : o.text!).trim(),
          })),
        },
      },
      include: { options: true },
    });

    return NextResponse.json({ poll, id: poll.id }, { status: 201 });
  } catch (error) {
    console.error("[POLLS_POST]", error);
    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
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

    const polls = await prisma.poll.findMany({
      where: {
        deletedAt: null,
        ...(user.role !== "ADMIN" && { createdById: user.id }),
      },
      include: {
        _count: { select: { options: true, votes: true } },
        creator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(polls);
  } catch (error) {
    console.error("[POLLS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}