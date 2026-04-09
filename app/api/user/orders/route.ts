// app/api/user/orders/route.ts
//
// UPDATED: Returns referenceCode, paymentMethod, proofUrl
// so MyTicketsClient can show status and link to pending page.

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
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
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        // Manual payment fields
        referenceCode: true,
        paymentMethod: true,
        proofUrl: true,
        tickets: {
          select: {
            id: true,
            status: true,
            qrCode: true,
            qrImage: true,
            createdAt: true,
            ticketType: {
              select: {
                id: true,
                name: true,
                price: true,
                event: {
                  select: {
                    id: true,
                    title: true,
                    date: true,
                    location: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("User orders error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}