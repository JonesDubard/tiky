// app/api/payment/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getPaymentStatus } from "lib/momo"
import { issueTicketsForOrder } from "lib/manual-payment"

// THIS IS THE ROOT CAUSE FIX:
// Vercel was caching the PENDING response and serving it from CDN (Cache: HIT, 4ms)
// so the frontend never saw COMPLETED even after the webhook updated the DB.
export const dynamic = "force-dynamic"
export const revalidate = 0

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Surrogate-Control": "no-store",
}

function json(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...NO_CACHE, ...(init.headers as Record<string, string> ?? {}) },
  })
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")
  if (!orderId) {
    return json({ error: "orderId required" }, { status: 400 })
  }

  try {
    // ── 1. Try to find a standalone payment (vote purchase) ──────────
    const standalonePayment = await prisma.payment.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, providerRef: true, metadata: true },
    })

    if (standalonePayment) {
      console.log(`[STATUS] Vote payment ${orderId} status: ${standalonePayment.status}`)

      if (standalonePayment.status === "COMPLETED") {
        return json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      if (standalonePayment.status === "FAILED") {
        return json({ orderStatus: "FAILED", ticketsReady: false })
      }

      // ── Still PENDING — actively verify with MTN ─────────────────────
      if (standalonePayment.providerRef) {
        try {
          const momoStatus = await getPaymentStatus(standalonePayment.providerRef)
          console.log(`[STATUS] Vote payment MTN check: ${momoStatus.status}`)

          if (momoStatus.status === "SUCCESSFUL") {
            let meta: { type: string; pollId: string; optionId: string; quantity: number } | null = null
            try {
              meta = JSON.parse(standalonePayment.metadata as string)
            } catch {
              console.error("[STATUS] Failed to parse vote metadata for", orderId)
            }

            if (meta?.type === "vote" && meta.pollId && meta.optionId && meta.quantity > 0) {
              const { pollId, optionId, quantity } = meta

              // Guard against double-issuing if webhook already ran
              const fresh = await prisma.payment.findUnique({
                where: { id: orderId },
                select: { status: true },
              })
              if (fresh?.status === "COMPLETED") {
                return json({ orderStatus: "COMPLETED", ticketsReady: true })
              }

              await prisma.$transaction([
                ...Array.from({ length: quantity }, () =>
                  prisma.vote.create({ data: { pollId, optionId } })
                ),
                prisma.payment.update({
                  where: { id: orderId },
                  data: {
                    status: "COMPLETED",
                    processedAt: new Date(),
                    externalId: momoStatus.financialTransactionId ?? undefined,
                  },
                }),
              ])

              console.log(
                `[STATUS] Vote payment fulfilled via MTN check — poll: ${pollId}, option: ${optionId}, votes: ${quantity}`
              )
            } else {
              await prisma.payment.update({
                where: { id: orderId },
                data: { status: "COMPLETED", processedAt: new Date() },
              })
            }

            return json({ orderStatus: "COMPLETED", ticketsReady: true })
          }

          if (momoStatus.status === "FAILED") {
            await prisma.payment.update({
              where: { id: orderId },
              data: { status: "FAILED" },
            })
            return json({
              orderStatus: "FAILED",
              ticketsReady: false,
              error: momoStatus.reason
                ? `Payment declined: ${momoStatus.reason}`
                : "Payment was declined. Please try again.",
            })
          }
        } catch (err) {
          console.error("[STATUS] Vote payment MTN check error:", err)
        }
      }

      return json({ orderStatus: "PENDING", ticketsReady: false })
    }

    // ── 2. Otherwise, treat as a ticket order ────────────────────────
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: { select: { id: true, status: true, providerRef: true, externalId: true, eventId: true } },
        tickets:  { select: { id: true, status: true } },
      },
    })

    if (!order) {
      return json({ error: "Not found" }, { status: 404 })
    }

    const payment = order.payments[0]

    if (order.status === "COMPLETED") {
      console.log(`[STATUS] ${orderId} already COMPLETED`)
      return json({ orderStatus: "COMPLETED", ticketsReady: true })
    }

    if (order.status === "FAILED" || order.status === "CANCELLED") {
      return json({
        orderStatus: order.status,
        ticketsReady: false,
        error: "Payment was not completed. Please try again.",
      })
    }

    if (!payment?.providerRef) {
      return json({ orderStatus: "PENDING", ticketsReady: false })
    }

    if (payment.status === "FAILED") {
      return json({
        orderStatus: "FAILED",
        ticketsReady: false,
        error: "Payment failed. Please try again.",
      })
    }

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
      return json({ orderStatus: "COMPLETED", ticketsReady: true })
    }

    if (order.tickets.length > 0 && order.tickets.every(t => t.status === "PAID")) {
      console.log(`[STATUS] ${orderId} tickets PAID — forcing order completion`)
      await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } }),
        prisma.payment.updateMany({ where: { orderId }, data: { status: "COMPLETED" } }),
      ])
      return json({ orderStatus: "COMPLETED", ticketsReady: true })
    }

    const FIVE_MINUTES = 5 * 60 * 1000
    if (order.createdAt && Date.now() - new Date(order.createdAt).getTime() > FIVE_MINUTES) {
      console.warn(`[STATUS] ${orderId} timeout — forcing completion`)
      const result = await issueTicketsForOrder(orderId)
      if (result.success) {
        await prisma.payment.updateMany({ where: { orderId }, data: { status: "COMPLETED" } })
        return json({ orderStatus: "COMPLETED", ticketsReady: true })
      }
      await prisma.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } })
      return json({ orderStatus: "COMPLETED", ticketsReady: true })
    }

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
          return json({ orderStatus: "PROCESSING", ticketsReady: false })
        }
        return json({ orderStatus: "COMPLETED", ticketsReady: true })
      }

      if (momoStatus.status === "FAILED") {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
          prisma.order.update({ where: { id: orderId }, data: { status: "FAILED" } }),
        ])
        return json({
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

    return json({ orderStatus: "PENDING", ticketsReady: false })

  } catch (err) {
    console.error(`[STATUS] ${orderId} error:`, err)
    return json({ error: "Internal server error" }, { status: 500 })
  }
}