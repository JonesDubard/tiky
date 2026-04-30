// app/api/webhooks/mtn-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { revalidatePath } from "next/cache"
import { getPaymentStatus } from "lib/momo"
import { issueTicketsForOrder } from "lib/manual-payment"

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    console.log("[MOMO WEBHOOK] Received:", JSON.stringify(body))

    const referenceId: string | undefined =
      body.referenceId ?? body.externalId ?? body.financialTransactionId

    if (!referenceId) {
      console.warn("[MOMO WEBHOOK] No referenceId in payload")
      // Always return 200 to prevent MTN retries
      return NextResponse.json({ received: true })
    }

    const payment = await prisma.payment.findUnique({
      where:   { providerRef: referenceId },
      include: { order: { include: { tickets: true } } },
    })

    if (!payment || !payment.order) {
      console.warn(`[MOMO WEBHOOK] No payment found for ref: ${referenceId}`)
      return NextResponse.json({ received: true })
    }

    // Idempotency guard — already completed or failed
    if (payment.status === "COMPLETED" || payment.status === "FAILED") {
      console.log(`[MOMO WEBHOOK] Payment already ${payment.status}`)
      return NextResponse.json({ received: true })
    }

    // Verify with MTN — don't blindly trust the webhook payload
    let momoStatus
    try {
      momoStatus = await getPaymentStatus(referenceId)
      console.log(`[MOMO WEBHOOK] MTN status: ${momoStatus.status}`)
    } catch (err) {
      console.error("[MOMO WEBHOOK] MTN check failed:", err)
      // If we can't verify, still acknowledge but don't fulfill
      return NextResponse.json({ received: true })
    }

    if (momoStatus.status === "SUCCESSFUL") {
      // ── FULFILL ORDER ────────────────────────────────────────
      const result = await issueTicketsForOrder(payment.order.id)

      if (result.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data:  {
            status:      "COMPLETED",
            externalId:  momoStatus.financialTransactionId ?? undefined,
            processedAt: new Date(),
          },
        })

        if (payment.eventId) revalidatePath(`/events/${payment.eventId}`)

        console.log(`[MOMO WEBHOOK] Fulfilled order ${payment.order.id} — ${result.ticketCount} tickets`)
      } else {
        console.error(`[MOMO WEBHOOK] Fulfillment failed: ${result.error}`)
      }
    } else if (momoStatus.status === "FAILED") {
      // ── CANCEL ORDER ─────────────────────────────────────────
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
        prisma.order.update({ where: { id: payment.order.id }, data: { status: "FAILED" } }),
        prisma.ticketInstance.updateMany({
          where: { orderId: payment.order.id },
          data:  { status: "CANCELLED" },
        }),
      ])
      console.log(`[MOMO WEBHOOK] Payment FAILED — order ${payment.order.id} cancelled`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[MOMO WEBHOOK] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Some MTN configurations send POST instead of PUT
export const POST = PUT