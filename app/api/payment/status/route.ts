// app/api/payment/status/route.ts
//
// SURGICAL FIX:
// The previous version updated payment to COMPLETED before calling
// issueTicketsForOrder — then issueTicketsForOrder tried to updateMany
// the same payment record inside a transaction, causing a conflict.
// Now we let issueTicketsForOrder handle everything in one transaction.

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
        payments: { select: { id: true, status: true, providerRef: true, externalId: true, eventId: true } },
        tickets:  { select: { id: true, status: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const payment = order.payments[0]

    // ── Fast path: already COMPLETED in DB ───────────────────────────────────
    if (order.status === "COMPLETED") {
      console.log(`[STATUS] ${orderId} already COMPLETED`)
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

    // ── No payment record yet ────────────────────────────────────────────────
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

    // ── Payment already marked COMPLETED but order isn't ────────────────────
    // This means issueTicketsForOrder ran but failed — retry it
    if (payment.status === "COMPLETED" && order.status !== "COMPLETED") {
      console.log(`[STATUS] ${orderId} payment COMPLETED but order not — retrying fulfillment`)
      const result = await issueTicketsForOrder(orderId)
      console.log(`[STATUS] ${orderId} retry result:`, JSON.stringify(result))

      if (result.success) {
        return NextResponse.json({ orderStatus: "COMPLETED", ticketsReady: true })
      }
      return NextResponse.json({
        orderStatus:  "PROCESSING",
        ticketsReady: false,
        message:      "Payment confirmed. Finalizing tickets...",
      })
    }

    // ── Check MTN ────────────────────────────────────────────────────────────
    console.log(`[STATUS] ${orderId} checking MTN, providerRef: ${payment.providerRef}`)

    let momoStatus: { status: string; financialTransactionId: string | null; reason: string | null }
    try {
      momoStatus = await getPaymentStatus(payment.providerRef)
    } catch (err) {
      console.error(`[STATUS] ${orderId} MTN check error:`, err)
      return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
    }

    console.log(`[STATUS] ${orderId} MTN status: ${momoStatus.status}`)

    // ── MTN SUCCESSFUL ───────────────────────────────────────────────────────
    if (momoStatus.status === "SUCCESSFUL") {
      // Store the MTN transaction ID on the payment record BEFORE issuing
      // but do NOT mark it COMPLETED — let issueTicketsForOrder do that
      // atomically together with the order and tickets
      if (momoStatus.financialTransactionId && !payment.externalId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data:  { externalId: momoStatus.financialTransactionId },
        })
      }

      console.log(`[STATUS] ${orderId} calling issueTicketsForOrder`)
      const result = await issueTicketsForOrder(orderId)
      console.log(`[STATUS] ${orderId} issueTicketsForOrder result:`, JSON.stringify(result))

      if (!result.success) {
        console.error(`[STATUS] ${orderId} issueTicketsForOrder failed:`, result.error)
        return NextResponse.json({
          orderStatus:  "PROCESSING",
          ticketsReady: false,
          message:      "Payment confirmed. Generating tickets...",
        })
      }

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
          : "Payment was declined. Please try again.",
      })
    }

    // ── Still PENDING on MTN ─────────────────────────────────────────────────
    return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })

  } catch (err) {
    console.error(`[STATUS] Unexpected error for ${orderId}:`, err)
    return NextResponse.json({ orderStatus: "PENDING", ticketsReady: false })
  }
}