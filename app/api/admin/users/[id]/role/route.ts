// app/api/admin/users/[id]/role/route.ts
//
// PATCH /api/admin/users/[id]/role
// Body: { role: "USER" | "ORGANIZER" }
//
// Rules:
// - Only ADMIN can call this
// - Cannot change another ADMIN's role (safety guard)
// - Cannot change your own role (prevents self-lockout)

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const ALLOWED_ROLES = ["USER", "ORGANIZER"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: targetId } = await params
    const body = await req.json()
    const { role } = body

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` },
        { status: 400 }
      )
    }

    // Prevent self role change
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })

    if (currentUser?.id === targetId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      )
    }

    // Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, name: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Cannot demote another ADMIN
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change role of another admin" },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, role: true, name: true, email: true },
    })

    console.log(
      `[ROLE] ${session.user.email} changed ${updated.email} → ${role}`
    )

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("[ROLE] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}