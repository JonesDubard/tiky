// app/api/polls/[id]/toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;
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

    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Organizers can only toggle their own polls
    if (user.role === "ORGANIZER" && poll.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newStatus = poll.status === "ACTIVE" ? "CLOSED" : "ACTIVE";

    const updated = await prisma.poll.update({
      where: { id: pollId },
      data: { status: newStatus },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error("Toggle poll error:", error);
    return NextResponse.json(
      { error: "Failed to toggle poll status" },
      { status: 500 }
    );
  }
}