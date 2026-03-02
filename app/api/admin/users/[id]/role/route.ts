// app/api/admin/users/[id]/role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden — Admins only" }, { status: 403 });
    }

    // Prevent changing own role
    if (currentUser.id === targetUserId) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent changing another admin's role
    if (targetUser.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot change role of another Admin" }, { status: 400 });
    }

    const body = await req.json();
    const { role } = body;

    if (!["USER", "ORGANIZER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be USER or ORGANIZER" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}