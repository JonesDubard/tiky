// app/api/payment/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getPaymentStatus } from "lib/momo"
import { issueTicketsForOrder } from "lib/manual-payment"

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 })
  }

  try {
    // First, try to find an order (for ticket purchases)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { select: { id: true, status: true, providerRef: true, externalId: true, eventId: true } },
        tickets:  { select: { id: true, status: true } },
      },
    })

    // If order exists, process as ticket order
    if (order) {
      const payment = order.payments[0]

      // ── Fast path: already COMPLETED ─────────────────────────────────
      if (order.status === "COMPLETED") {
        console.log(`[STATUS] ${orderId} already COMPLETED`)
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      // ── Already failed / cancelled ───────────────────────────────────
      if (order.status === "FAILED" || order.status === "CANCELLED") {
        return NextResponse.json({
          orderStatus: order.status,
          ticketsReady: false,
          error: "Payment was not completed. Please try again.",
        })
      }

      // ── No payment record yet ────────────────────────────────────────
      if (!payment?.providerRef) {
        return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
      }

      if (payment.status === "FAILED") {
        return NextResponse.json({
          orderStatus: "FAILED",
          ticketsReady: false,
          error: "Payment failed. Please try again.",
        })
      }

      // ── Still PENDING — run all fallbacks and MTN check ──────────────
      // 1. Payment already marked COMPLETED (webhook/admin did it)
      if (payment.status === "COMPLETED") {
        if (order.status !== "COMPLETED") {
          console.log(`[STATUS] ${orderId} payment COMPLETED but order not — fixing`)
          await prisma.$transaction([
            prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }),
            prisma.ticketInstance.updateMany({
              where: { orderId, status: "RESERVED" },
              data: { status: "PAID" },
            }),
          ])
        }
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      // 2. Tickets already PAID (webhook may have issued them)
      if (order.tickets.length > 0 && order.tickets.every(t => t.status === "PAID")) {
        console.log(`[STATUS] ${orderId} tickets PAID — forcing order completion`)
        await prisma.$transaction([
          prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }),
          prisma.payment.updateMany({ where: { orderId }, data: { status: "COMPLETED" } }),
        ])
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      // 3. Timeout (order older than 5 minutes)
      const FIVE_MINUTES = 5 * 60 * 1000
      if (order.createdAt && Date.now() - new Date(order.createdAt).getTime() > FIVE_MINUTES) {
        console.warn(`[STATUS] ${orderId} timeout — forcing completion`)
        const result = await issueTicketsForOrder(orderId)
        if (result.success) {
          await prisma.payment.updateMany({ where: { orderId }, data: { status: "COMPLETED" } })
          return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
        }
        await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } })
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      // 4. Normal MTN check
      try {
        const momoStatus = await getPaymentStatus(payment.providerRef!)
        console.log(`[STATUS] ${orderId} MTN status: ${momoStatus.status}`)

        if (momoStatus.status === "SUCCESSFUL") {
          if (momoStatus.financialTransactionId && !payment.externalId) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { externalId: momoStatus.financialTransactionId },
            })
          }
          const result = await issueTicketsForOrder(orderId)
          if (!result.success) {
            return NextResponse.json({ orderStatus: "PROCESSING", ticketsReady: false })
          }
          return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
        }

        if (momoStatus.status === "FAILED") {
          await prisma.$transaction([
            prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
            prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
          ])
          return NextResponse.json({
            orderStatus: "FAILED",
            ticketsReady: false,
            error: momoStatus.reason
              ? `Payment declined: ${momoStatus.reason}`
              : "Payment was declined. Please try again.",
          })
        }
      } catch (err) {
        console.error(`[STATUS] ${orderId} MTN check error:`, err)
      }

      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }

   // ── No order found → vote-only payment ────────────────────────────
const payment = await prisma.payment.findUnique({
  where: { id: orderId },
  select: { id: true, status: true, metadata: true },
})

if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })

// For vote payments: ONLY trust the DB status.
// The webhook already handles crediting votes and marking COMPLETED.
// Re-calling MTN here causes race conditions — MTN may return PENDING
// on a second call even after the payment succeeded.
if (payment.status === "COMPLETED") {
  return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
}
if (payment.status === "FAILED") {
  return NextResponse.json({ orderStatus: "FAILED", ticketsReady: false })
}
return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
  } catch (err) {
    console.error(`[STATUS] ${orderId} error:`, err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}