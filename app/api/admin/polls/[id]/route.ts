// app/api/admin/polls/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

async function getAuthorizedUser(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });
}

function canManagePoll(
  user: { id: string; role: string },
  poll: { createdById: string | null }
) {
  return user.role === "ADMIN" || poll.createdById === user.id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [poll, user] = await Promise.all([
      prisma.poll.findUnique({
        where: { id, deletedAt: null },
        include: {
          options: { orderBy: { createdAt: "asc" } },
          creator: { select: { id: true, name: true, email: true } },
        },
      }),
      getAuthorizedUser(session.user.email),
    ]);

    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!user || !canManagePoll(user, poll)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("[POLL_GET]", error);
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

    const [existingPoll, user] = await Promise.all([
      prisma.poll.findUnique({
        where: { id, deletedAt: null },
        select: { createdById: true },
      }),
      getAuthorizedUser(session.user.email),
    ]);

    if (!existingPoll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!user || !canManagePoll(user, existingPoll)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      status,
      isFeatured,
      endDate,
      eventId,
      votePrice,
      options,
    } = body;

    // Normalize pollType
    const normalizedPollType = "PUBLIC";

    const updatedPoll = await prisma.$transaction(async (tx) => {
      const updated = await tx.poll.update({
        where: { id },
        data: {
          title: title?.trim(),
          description: description?.trim() || null,
          pollType: "PUBLIC",
          status,
          isFeatured: isFeatured ?? false,
          endDate: endDate ? new Date(endDate) : null,
          eventId: eventId || null,
          votePrice: votePrice ? parseFloat(votePrice) : null,
        },
      });

      if (options && Array.isArray(options)) {
        const validOptions = options.filter((o: { text?: string } | string) =>
          typeof o === "string" ? o.trim() : o?.text?.trim()
        );

        const incomingIds = validOptions
          .filter((o: { id?: string }) => typeof o !== "string" && o.id)
          .map((o: { id: string }) => o.id);

        // Remove options not in the incoming list
        await tx.pollOption.deleteMany({
          where: { pollId: id, id: { notIn: incomingIds } },
        });

        // Upsert each option
        for (const o of validOptions) {
          const text = (typeof o === "string" ? o : o.text!).trim();
          const oid = typeof o !== "string" ? o.id : undefined;

          if (oid) {
            await tx.pollOption.update({ where: { id: oid }, data: { text } });
          } else {
            await tx.pollOption.create({ data: { pollId: id, text } });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({ poll: updatedPoll, id: updatedPoll.id });
  } catch (error) {
    console.error("[POLL_PUT]", error);
    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}

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

    const [poll, user] = await Promise.all([
      prisma.poll.findUnique({
        where: { id, deletedAt: null },
        select: { createdById: true },
      }),
      getAuthorizedUser(session.user.email),
    ]);

    if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    if (!user || !canManagePoll(user, poll)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.poll.update({
      where: { id },
      data: { deletedAt: new Date() }, 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POLL_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete poll" }, { status: 500 });
  }
}