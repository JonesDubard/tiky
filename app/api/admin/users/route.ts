// app/api/admin/users/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        // status field — if your schema has it use it, otherwise we derive it
        _count: {
          select: { events: true },
        },
      },
    })

    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      image: u.image,
      createdAt: u.createdAt,
      eventsCount: u._count.events,
      // If your schema has a `status` or `suspended` field, map it here.
      // For now defaulting to "active" — update if you have a status column.
      status: "active" as "active" | "suspended",
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Error fetching users:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}