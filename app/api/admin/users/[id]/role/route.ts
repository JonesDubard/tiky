// app/api/admin/users/[id]/role/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "app/api/auth/[...nextauth]/route"
import { prisma } from "lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const { role } = await req.json()

    if (!["USER", "ORGANIZER", "ADMIN"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error("Error updating user role:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}