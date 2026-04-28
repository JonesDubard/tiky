// app/api/webhooks/mtn-momo/route.ts


import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { revalidatePath } from "next/cache"
import { getPaymentStatus } from "lib/momo"
import { issueTicketsForOrder } from "lib/manual-payment"

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const referenceId: string | undefined =
      body.referenceId ?? body.externalId ?? body.financialTransactionId

    if (!referenceId) {
      console.warn("[MOMO WEBHOOK] No referenceId in payload:", body)
      return NextResponse.json({ error: "Missing referenceId" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where:   { providerRef: referenceId },
      include: { order: { include: { tickets: true } } },
    })

    if (!payment || !payment.order) {
      // Return 200 — MTN should not keep retrying for unknown refs
      return NextResponse.json({ received: true })
    }

    // Idempotency guard
    if (payment.status === "COMPLETED" || payment.status === "FAILED") {
      return NextResponse.json({ received: true })
    }

    // Verify with MTN directly (don't trust payload alone)
    let momoStatus: Awaited<ReturnType<typeof getPaymentStatus>>
    try {
      momoStatus = await getPaymentStatus(referenceId)
    } catch (err) {
      console.error("[MOMO WEBHOOK] Status check failed:", err)
      return NextResponse.json({ error: "Could not verify status" }, { status: 500 })
    }

    if (momoStatus.status === "SUCCESSFUL") {
      await fulfillOrder(
        payment.id,
        payment.order.id,
        momoStatus.financialTransactionId,
        payment.eventId
      )
    } else if (momoStatus.status === "FAILED") {
      await cancelOrder(payment, payment.order.tickets)
    }

    revalidatePath("/admin")
    if (payment.eventId) revalidatePath(`/events/${payment.eventId}`)

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[MOMO WEBHOOK] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// MTN sometimes sends POST instead of PUT depending on region config
export const POST = PUT

// ── fulfillOrder ─────────────────────────────────────────────────────────────
// Exported so the polling endpoint can call it too.
// issueTicketsForOrder is idempotent — safe to call multiple times.
export async function fulfillOrder(
  paymentId:              string,
  orderId:                string,
  financialTransactionId: string | null,
  eventId:                string | null | undefined
) {
  const result = await issueTicketsForOrder(orderId)

  if (!result.success) {
    console.error("[MOMO] issueTicketsForOrder failed:", result.error)
    return
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status:      "COMPLETED",
      externalId:  financialTransactionId ?? undefined,
      processedAt: new Date(),
    },
  })

  console.log(
    `[MOMO] Fulfilled — orderId: ${orderId} | txId: ${financialTransactionId} | tickets: ${result.ticketCount}`
  )
}

// ── cancelOrder ───────────────────────────────────────────────────────────────
async function cancelOrder(
  payment: { id: string; orderId: string | null },
  tickets: { id: string; ticketTypeId: string }[]
) {
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } })

    if (payment.orderId) {
      await tx.order.update({ where: { id: payment.orderId }, data: { status: "FAILED" } })
      await tx.ticketInstance.updateMany({
        where: { orderId: payment.orderId },
        data:  { status: "CANCELLED" },
      })

      // Restore inventory
      const countByType: Record<string, number> = {}
      for (const t of tickets) {
        countByType[t.ticketTypeId] = (countByType[t.ticketTypeId] ?? 0) + 1
      }
      for (const [ticketTypeId, count] of Object.entries(countByType)) {
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data:  { quantity: { increment: count } },
        })
      }
    }
  })

  console.log(`[MOMO] Cancelled order: ${payment.orderId}`)
}