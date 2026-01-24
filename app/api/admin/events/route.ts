import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, date, location, imageUrl } = body

    if (!title || !date || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        imageUrl,

        // ✅ Explicit relation write (this is the key fix)
        createdBy: {
          connect: { id: session.user.id }
        }
      }
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("EVENT CREATE ERROR:", error)
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    )
  }
}
