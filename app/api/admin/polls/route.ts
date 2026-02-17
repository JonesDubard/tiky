import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, pollType, status, isFeatured, endDate, options } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create poll with options
    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        pollType: pollType || 'FREE',
        status: status || 'ACTIVE',
        isFeatured: isFeatured || false,
        endDate: endDate ? new Date(endDate) : null,
        creatorId: user.id,
        options: {
          create: options.map((text: string) => ({ text })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json(poll);
  } catch (error) {
    console.error("[POLLS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    const polls = await prisma.poll.findMany({
      where: user.role === 'ADMIN' ? {} : { creatorId: user.id },
      include: {
        _count: {
          select: {
            options: true,
            votes: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(polls);
  } catch (error) {
    console.error("[POLLS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 }
    );
  }
}