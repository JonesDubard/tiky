// app/api/payment/status/route.ts
// Polled by /checkout/pending every 5 seconds.
//
// FIXES:
// 1. Checks DB order status FIRST before calling MTN — avoids redundant API calls
// 2. Calls fulfillOrder directly when MTN returns SUCCESSFUL
// 3. Logs every step so Vercel logs show exactly where it's failing
// 4. Returns detailed status so the pending page knows what to show
//
// GET /api/payment/status?orderId=xxx

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

    // ── Fast path: already fully completed in DB ─────────────────────────────
    if (order.status === "COMPLETED") {
      const ticketsReady = order.tickets.length > 0 &&
        order.tickets.every(t => t.status === "PAID" && t.qrImage)

      if (ticketsReady) {
        console.log(`[STATUS] Order ${orderId} already COMPLETED with tickets ready`)
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      // Order is COMPLETED but tickets not yet PAID — run fulfillment again
      console.log(`[STATUS] Order ${orderId} COMPLETED but tickets not ready — re-running fulfillment`)
      const result = await issueTicketsForOrder(orderId)
      console.log(`[STATUS] Re-fulfillment result:`, result)

      return NextResponse.json({
        orderStatus:  "COMPLETED",
        ticketsReady: result.success,
      })
    }

    // ── Already failed ───────────────────────────────────────────────────────
    if (order.status === "FAILED" || order.status === "CANCELLED") {
      return NextResponse.json({
        orderStatus:  order.status,
        ticketsReady: false,
        error:        "Payment was not completed. Please try again.",
      })
    }

    // ── Still PENDING — check with MTN ───────────────────────────────────────
    if (!payment?.providerRef) {
      console.warn(`[STATUS] Order ${orderId} has no payment providerRef`)
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }

    if (payment.status === "FAILED") {
      return NextResponse.json({
        orderStatus:  "FAILED",
        ticketsReady: false,
        error:        "Payment failed. Please try again.",
      })
    }

    console.log(`[STATUS] Checking MTN status for order ${orderId}, ref: ${payment.providerRef}`)

    let momoStatus: { status: string; financialTransactionId: string | null; reason: string | null }
    try {
      momoStatus = await getPaymentStatus(payment.providerRef)
    } catch (err) {
      // MTN API error — don't fail the user, just say still pending
      console.error(`[STATUS] MTN status check failed for ${orderId}:`, err)
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }

    console.log(`[STATUS] MTN status for ${orderId}: ${momoStatus.status}`)

    // ── MTN says SUCCESSFUL ──────────────────────────────────────────────────
    if (momoStatus.status === "SUCCESSFUL") {
      // 1. Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status:      "COMPLETED",
          externalId:  momoStatus.financialTransactionId ?? undefined,
          processedAt: new Date(),
        },
      })

      // 2. Issue tickets (generates QR, marks tickets PAID, marks order COMPLETED)
      console.log(`[STATUS] Running issueTicketsForOrder for ${orderId}`)
      const result = await issueTicketsForOrder(orderId)
      console.log(`[STATUS] issueTicketsForOrder result:`, JSON.stringify(result))

      if (!result.success) {
        console.error(`[STATUS] issueTicketsForOrder failed for ${orderId}:`, result.error)
        // Don't return FAILED to user — payment went through, this is a system error
        // Admin can manually approve from the dashboard
        return NextResponse.json({
          orderStatus:  "PROCESSING",
          ticketsReady: false,
          message:      "Payment confirmed. Generating your tickets...",
        })
      }

      return NextResponse.json({
        orderStatus:  "COMPLETED",
        ticketsReady: true,
      })
    }

    // ── MTN says FAILED ──────────────────────────────────────────────────────
    if (momoStatus.status === "FAILED") {
      // Update DB
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data:  { status: "FAILED" },
        }),
        prisma.order.update({
          where: { id: orderId },
          data:  { status: "FAILED" },
        }),
      ])

      return NextResponse.json({
        orderStatus:  "FAILED",
        ticketsReady: false,
        error:        momoStatus.reason
          ? `Payment failed: ${momoStatus.reason}. Please try again.`
          : "Payment was declined or cancelled. Please try again.",
      })
    }

    // ── Still PENDING on MTN side ────────────────────────────────────────────
    return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })

  } catch (err) {
    console.error(`[STATUS] Unexpected error for order ${orderId}:`, err)
    return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
  }
}