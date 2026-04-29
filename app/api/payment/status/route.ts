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
          select: { id: true, status: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const payment = order.payments[0]

    // ── Fast path: DB already shows COMPLETED ────────────────────────────────
    // Return immediately — do NOT check qrImage here
    // The success page handles showing a loading state while QR generates
    if (order.status === "COMPLETED") {
      console.log(`[STATUS] ${orderId} → COMPLETED (from DB)`)
      return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
    }

    // ── Already failed ───────────────────────────────────────────────────────
    if (order.status === "FAILED" || order.status === "CANCELLED") {
      return NextResponse.json({
        orderStatus:  order.status,
        ticketsReady: false,
        error:        "Payment was not completed. Please try again.",
      })
    }

    // ── No payment record ────────────────────────────────────────────────────
    if (!payment?.providerRef) {
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }

    if (payment.status === "FAILED") {
      return NextResponse.json({
        orderStatus:  "FAILED",
        ticketsReady: false,
        error:        "Payment failed. Please try again.",
      })
    }

    // ── Check MTN for current status ─────────────────────────────────────────
    console.log(`[STATUS] ${orderId} → checking MTN, ref: ${payment.providerRef}`)

    let momoStatus: { status: string; financialTransactionId: string | null; reason: string | null }
    try {
      momoStatus = await getPaymentStatus(payment.providerRef)
    } catch (err) {
      console.error(`[STATUS] MTN check failed for ${orderId}:`, err)
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }

    console.log(`[STATUS] ${orderId} → MTN says: ${momoStatus.status}`)

    // ── MTN SUCCESSFUL ───────────────────────────────────────────────────────
    if (momoStatus.status === "SUCCESSFUL") {
      // Update payment first
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status:      "COMPLETED",
          externalId:  momoStatus.financialTransactionId ?? undefined,
          processedAt: new Date(),
        },
      })

      // Issue tickets — generates QR and marks order COMPLETED
      console.log(`[STATUS] ${orderId} → running issueTicketsForOrder`)
      const result = await issueTicketsForOrder(orderId)
      console.log(`[STATUS] ${orderId} → issueTicketsForOrder:`, JSON.stringify(result))

      if (!result.success) {
        // Tickets failed to generate — but payment went through
        // Return PROCESSING so pending page shows "generating tickets"
        // Admin can manually trigger from dashboard if needed
        console.error(`[STATUS] ${orderId} → issueTicketsForOrder failed:`, result.error)
        return NextResponse.json({
          orderStatus:  "PROCESSING",
          ticketsReady: false,
          message:      "Payment confirmed. Generating tickets…",
        })
      }

      // All good — order is now COMPLETED in DB
      return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
    }

    // ── MTN FAILED ───────────────────────────────────────────────────────────
    if (momoStatus.status === "FAILED") {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
        prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
      ])

      return NextResponse.json({
        orderStatus:  "FAILED",
        ticketsReady: false,
        error:        momoStatus.reason
          ? `Payment declined: ${momoStatus.reason}`
          : "Payment was declined or cancelled. Please try again.",
      })
    }

    // ── Still PENDING on MTN ─────────────────────────────────────────────────
    return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })

  } catch (err) {
    console.error(`[STATUS] Unexpected error for ${orderId}:`, err)
    return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
  }
}