// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
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
              },
            },
          },
        },
        payments: {
          select: {
            paymentMethod: true,
            status: true,
            amount: true,
            currency: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err: any) {
    console.error("Order fetch error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}