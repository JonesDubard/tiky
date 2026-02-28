// app/api/payment/confirm-card/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { generateTicketsForOrder } from "lib/tickets/generate"

export async function POST(req: NextRequest) {
  try {
    const { orderId, quantities } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: true, payments: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Already processed — idempotent
    if (order.ticketGenerated) {
      return NextResponse.json({ ok: true, alreadyProcessed: true })
    }

    // Mark payment as COMPLETED
    await prisma.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "COMPLETED", processedAt: new Date() },
    })

    // Mark order as COMPLETED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    })

    // Generate tickets
    await generateTicketsForOrder(orderId, quantities)

    console.log(`✅ Card payment confirmed and tickets generated for order ${orderId}`)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("confirm-card error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}