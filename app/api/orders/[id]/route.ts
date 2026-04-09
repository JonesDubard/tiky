// app/api/orders/[id]/route.ts
//
// UPDATED: Returns referenceCode, proofUrl, proofNote, paymentMethod
// so the pending page can display instructions and proof status.

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
      select: {
        id: true,
        status: true,
        totalPrice: true,
        // New manual payment fields
        referenceCode: true,
        proofUrl: true,
        proofNote: true,
        paymentMethod: true,
        ticketGenerated: true,
        createdAt: true,
        tickets: {
          select: {
            id: true,
            status: true,
            qrCode: true,
            qrImage: true,
            guestName: true,
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
        payments: {
          select: {
            paymentMethod: true,
            status: true,
            amount: true,
            currency: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err: unknown) {
    console.error("Order fetch error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}