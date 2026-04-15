// app/api/admin/users/route.ts
import { NextResponse } from "next/server"
import { requirePermission } from "lib/auth-guard"
import { prisma } from "lib/prisma"

export async function GET() {
  const { error, session } = await requirePermission("manageUsers")
  if (error) return error   // Returns 401 or 403 automatically

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      _count: { select: { events: true } }
    }
  })

  return NextResponse.json(users)
}