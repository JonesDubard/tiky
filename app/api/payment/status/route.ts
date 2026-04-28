// app/api/payment/status/route.ts
// Polled by /checkout/pending every 3 seconds.
// Checks DB first (fast path), then verifies with MTN if still PENDING.
// Triggers fulfillment when MTN confirms SUCCESSFUL.
//
// GET /api/payment/status?orderId=xxx

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getPaymentStatus } from "lib/momo"
import { fulfillOrder } from "app/api/webhooks/mtn-momo/route"

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: {
      payments: {
        select: {
          id:          true,
          status:      true,
          providerRef: true,
          externalId:  true,
          eventId:     true,
        },
      },
      tickets: {
        select: { id: true, status: true, qrImage: true },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const payment = order.payments[0]

  // ── Already completed ────────────────────────────────────────────────────
  if (order.status === "COMPLETED" && order.tickets.every(t => t.status === "PAID")) {
    return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
  }

  // ── Already failed / cancelled ───────────────────────────────────────────
  if (order.status === "FAILED" || order.status === "CANCELLED") {
    return NextResponse.json({
      orderStatus:  order.status,
      ticketsReady: false,
      error:        "Payment was not completed. Please try again.",
    })
  }

  // ── Still PENDING — check with MTN ───────────────────────────────────────
  if (payment?.providerRef && payment.status !== "FAILED") {
    try {
      const momoStatus = await getPaymentStatus(payment.providerRef)

      if (momoStatus.status === "SUCCESSFUL") {
        await fulfillOrder(payment.id, orderId, momoStatus.financialTransactionId, payment.eventId)
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      if (momoStatus.status === "FAILED") {
        return NextResponse.json({
          orderStatus:  "FAILED",
          ticketsReady: false,
          error:        "Payment was declined or timed out. Please try again.",
        })
      }

      // Still PENDING on MTN side
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    } catch (err) {
      console.error("[PAYMENT STATUS] MoMo check failed:", err)
      // Don't surface MoMo errors to client
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }
  }

  return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
}