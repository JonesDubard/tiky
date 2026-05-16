// app/api/webhooks/mtn-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { revalidatePath } from "next/cache"
import { getPaymentStatus } from "lib/momo"
import { issueTicketsForOrder } from "lib/manual-payment"

export async function PUT(req: NextRequest) {
  // console.log("[MOMO WEBHOOK] ← HIT", req.method, req.url)
  try {
    const body = await req.json().catch(() => ({}))
    console.log("[MOMO WEBHOOK] Received:", JSON.stringify(body))

    const referenceId: string | undefined =
      body.referenceId ?? body.externalId ?? body.financialTransactionId

    if (!referenceId) {
      console.warn("[MOMO WEBHOOK] No referenceId in payload")
      return NextResponse.json({ received: true })
    }

    const payment = await prisma.payment.findUnique({
      where: { providerRef: referenceId },
      include: { order: { include: { tickets: true } } },
    })

    if (!payment) {
      console.warn(`[MOMO WEBHOOK] No payment found for ref: ${referenceId}`)
      return NextResponse.json({ received: true })
    }

    if (payment.status === "COMPLETED" || payment.status === "FAILED") {
      console.log(`[MOMO WEBHOOK] Payment already ${payment.status}`)
      return NextResponse.json({ received: true })
    }

    // ── Trust the webhook payload status directly ─────────────────────
    // MTN sends the final status in the webhook body — no need to re-call
    // their API. Re-calling causes 500s when MTN has internal errors.
    const webhookStatus = body.status as string | undefined

    let momoStatus: {
      status: string
      financialTransactionId: string | null
      reason: string | null
    }

    if (webhookStatus === "SUCCESSFUL") {
      momoStatus = {
        status: "SUCCESSFUL",
        financialTransactionId: body.financialTransactionId ?? null,
        reason: null,
      }
      console.log(`[MOMO WEBHOOK] Payload status: SUCCESSFUL`)
    } else if (webhookStatus === "FAILED") {
      momoStatus = {
        status: "FAILED",
        financialTransactionId: null,
        reason: body.reason ?? null,
      }
      console.log(`[MOMO WEBHOOK] Payload status: FAILED — reason: ${body.reason ?? "unknown"}`)
    } else {
      // Unknown/missing status in payload — verify with MTN as fallback
      console.log(`[MOMO WEBHOOK] No clear status in payload, checking MTN API...`)
      try {
        momoStatus = await getPaymentStatus(referenceId)
        console.log(`[MOMO WEBHOOK] MTN API status: ${momoStatus.status}`)
      } catch (err) {
        console.error("[MOMO WEBHOOK] MTN check failed:", err)
        return NextResponse.json({ received: true })
      }
    }

    if (momoStatus.status === "SUCCESSFUL") {

      // ── Vote purchase ─────────────────────────────────────────
      const isVotePurchase = payment.metadata && (() => {
        try {
          return JSON.parse(payment.metadata as string)?.type === "vote"
        } catch { return false }
      })()

      if (isVotePurchase) {
        const meta = JSON.parse(payment.metadata as string)
        const { pollId, optionId, quantity } = meta as {
          pollId: string
          optionId: string
          quantity: number
        }

        await prisma.$transaction([
          ...Array.from({ length: quantity }, () =>
            prisma.vote.create({
              data: { pollId, optionId },
            })
          ),
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "COMPLETED",
              externalId: momoStatus.financialTransactionId ?? undefined,
              processedAt: new Date(),
            },
          }),
        ])

        console.log(
          `[MOMO WEBHOOK] Vote purchase fulfilled — poll: ${pollId}, option: ${optionId}, votes: ${quantity}`
        )
        revalidatePath(`/polls/${pollId}`)
        revalidatePath(`/admin/polls/${pollId}`)
        return NextResponse.json({ received: true })
      }

      // ── Regular ticket order ──────────────────────────────────
      if (!payment.order) {
        console.warn("[MOMO WEBHOOK] No order associated with payment")
        return NextResponse.json({ received: true })
      }

      const result = await issueTicketsForOrder(payment.order.id)

      if (!result.success) {
        console.error(`[MOMO WEBHOOK] Fulfillment failed: ${result.error}`)
        return NextResponse.json({ received: true })
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          externalId: momoStatus.financialTransactionId ?? undefined,
          processedAt: new Date(),
        },
      })

      if (payment.eventId) revalidatePath(`/events/${payment.eventId}`)
      console.log(`[MOMO WEBHOOK] Fulfilled order ${payment.order.id} — ${result.ticketCount} tickets`)

    } else {
      // ── FAILED / CANCELLED / EXPIRED / REJECTED ───────────────
      if (payment.order) {
        await prisma.$transaction([
          prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
          prisma.order.update({ where: { id: payment.order.id }, data: { status: "FAILED" } }),
          prisma.ticketInstance.updateMany({
            where: { orderId: payment.order.id },
            data: { status: "CANCELLED" },
          }),
        ])
      } else {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        })
      }
      console.log(`[MOMO WEBHOOK] Payment failed — reason: ${momoStatus.reason ?? "unknown"}`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[MOMO WEBHOOK] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = PUT