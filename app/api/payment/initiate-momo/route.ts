// app/api/payment/initiate-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { eventId, quantities, phoneNumber } = await req.json()

    if (!eventId || !quantities || typeof quantities !== "object") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required for MTN MoMo" }, { status: 400 })
    }

    // Fetch ticket types
    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
    })

    if (!ticketTypes.length) {
      return NextResponse.json({ error: "No tickets found for this event" }, { status: 404 })
    }

    // Calculate total
    let totalAmount = 0
    for (const [ticketTypeId, qty] of Object.entries(quantities)) {
      const ticket = ticketTypes.find((t) => t.id === ticketTypeId)
      if (ticket) {
        totalAmount += ticket.price * (qty as number)
      }
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 })
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        totalPrice: totalAmount,
        eventId,
        userId: session?.user?.id ?? null,
      },
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: totalAmount,
        currency: "USD",
        status: "PENDING",
        paymentMethod: "mtn_momo",
        orderId: order.id,
        userId: session?.user?.id ?? null,
        eventId,
      },
    })

    // TODO: Integrate MTN MoMo API to request payment from phoneNumber
    // For now, return a redirect to a pending page
    // When MoMo webhook fires at /api/webhooks/mtn-momo it will complete the order

    console.log(`MTN MoMo payment initiated for order ${order.id}, phone: ${phoneNumber}`)

    return NextResponse.json({
      orderId: order.id,
      paymentId: payment.id,
      redirectUrl: `/checkout/success?orderId=${order.id}&method=mtn_momo`,
      message: "MTN MoMo payment initiated. Please approve on your phone.",
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("initiate-momo error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
