// app/api/user/orders/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "app/api/auth/[...nextauth]/route"
import { prisma } from "lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        payments: {
          select: {
            paymentMethod: true,
            status: true,
            amount: true,
            currency: true,
          },
        },
        tickets: {
          include: {
            ticketType: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    date: true,
                    location: true,
                    imageUrl: true,
                  },
                },
                // Get sold count for availability bar
                _count: {
                  select: {
                    tickets: {
                      where: { status: { in: ["PAID", "USED"] } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Shape the data — add soldCount to ticketType
    const shaped = orders.map(order => ({
      ...order,
      tickets: order.tickets.map(ticket => ({
        ...ticket,
        ticketType: {
          ...ticket.ticketType,
          soldCount: ticket.ticketType._count.tickets,
          _count: undefined,
        },
      })),
    }))

    return NextResponse.json(shaped)
  } catch (error: any) {
    console.error("User orders error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}