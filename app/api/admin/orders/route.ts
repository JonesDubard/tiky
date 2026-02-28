// app/api/admin/orders/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search") || ""

    const orders = await prisma.order.findMany({
      where: {
        ...(status && status !== "all" ? { status } : {}),
        ...(search ? {
          OR: [
            { id: { contains: search } },
            { user: { email: { contains: search } } },
            { user: { name: { contains: search } } },
          ],
        } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        tickets: {
          include: {
            ticketType: {
              include: {
                event: {
                  select: { id: true, title: true, date: true },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            processedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}