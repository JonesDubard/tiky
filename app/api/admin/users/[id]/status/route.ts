// app/api/admin/users/[id]/status/route.ts
//
// PATCH /api/admin/users/[id]/status
// Body: { status: "active" | "suspended" }
//
// Rules:
// - Only ADMIN can call this
// - Cannot suspend another ADMIN
// - Cannot suspend yourself

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

const ALLOWED_STATUSES = ["active", "suspended"]

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
    const { status } = body

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be: active or suspended` },
        { status: 400 }
      )
    }

    // Prevent self-suspension
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })

    if (currentUser?.id === targetId) {
      return NextResponse.json(
        { error: "You cannot suspend your own account" },
        { status: 400 }
      )
    }

    // Fetch target
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true, status: true, name: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Cannot suspend another admin
    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot suspend another admin account" },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { status },
      select: { id: true, status: true, name: true, email: true },
    })

    const action = status === "suspended" ? "suspended" : "reinstated"
    console.log(
      `[STATUS] ${session.user.email} ${action} ${updated.email}`
    )

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("[STATUS] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}