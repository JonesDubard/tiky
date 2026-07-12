// app/api/webhooks/orange-money/route.ts
//
// Orange Money Business API notification endpoint.
// Subscription probe + debit SUCCESS/FAILED fulfillment.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { revalidatePath } from "next/cache"
import { issueTicketsForOrder } from "lib/manual-payment"
import {
  orangeUnauthorizedResponse,
  verifyOrangeCallbackAuth,
} from "lib/orange/callback-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function handleOrangeCallback(req: NextRequest) {
  const authResult = verifyOrangeCallbackAuth(req.headers.get("authorization"))

  if (authResult === "misconfigured") {
    return NextResponse.json(
      { error: "Callback credentials are not configured" },
      { status: 500 }
    )
  }

  if (authResult === "missing" || authResult === "invalid") {
    console.warn(`[ORANGE CALLBACK] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  const body = await req.json().catch(() => ({}))
  console.log("[ORANGE CALLBACK] Received:", JSON.stringify(body))

  // Orange Developer Portal subscription compliance probe
  if (body?.action === "test") {
    return NextResponse.json({ status: "ok", action: "test" })
  }

  const transactionId: string | undefined =
    body?.transactionData?.transactionId ?? body?.transactionId

  if (!transactionId) {
    console.warn("[ORANGE CALLBACK] No transactionId in payload")
    return NextResponse.json({ received: true })
  }

  const payment = await prisma.payment.findUnique({
    where: { providerRef: transactionId },
    include: { order: { include: { tickets: true } } },
  })

  if (!payment) {
    console.warn(`[ORANGE CALLBACK] No payment for ref: ${transactionId}`)
    return NextResponse.json({ received: true })
  }

  if (payment.status === "COMPLETED" || payment.status === "FAILED") {
    return NextResponse.json({ received: true })
  }

  const rawStatus = String(body?.status ?? "").toUpperCase()
  const txnId: string | null =
    body?.transactionData?.txnId ?? body?.txnId ?? null
  const message: string | null = body?.message ?? null

  if (rawStatus === "SUCCESS" || rawStatus === "SUCCESSFUL") {
    const isVotePurchase =
      payment.metadata &&
      (() => {
        try {
          return JSON.parse(payment.metadata as string)?.type === "vote"
        } catch {
          return false
        }
      })()

    if (isVotePurchase) {
      const meta = JSON.parse(payment.metadata as string) as {
        pollId: string
        optionId: string
        quantity: number
      }

      await prisma.$transaction([
        ...Array.from({ length: meta.quantity }, () =>
          prisma.vote.create({
            data: { pollId: meta.pollId, optionId: meta.optionId },
          })
        ),
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            externalId: txnId ?? undefined,
            processedAt: new Date(),
          },
        }),
      ])

      revalidatePath(`/polls/${meta.pollId}`)
      revalidatePath(`/admin/polls/${meta.pollId}`)
      console.log(
        `[ORANGE CALLBACK] Vote fulfilled — poll: ${meta.pollId}, votes: ${meta.quantity}`
      )
      return NextResponse.json({ received: true })
    }

    if (!payment.order) {
      console.warn("[ORANGE CALLBACK] No order on payment")
      return NextResponse.json({ received: true })
    }

    const result = await issueTicketsForOrder(payment.order.id)
    if (!result.success) {
      console.error(`[ORANGE CALLBACK] Fulfillment failed: ${result.error}`)
      return NextResponse.json({ received: true })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        externalId: txnId ?? undefined,
        processedAt: new Date(),
      },
    })

    if (payment.eventId) revalidatePath(`/events/${payment.eventId}`)
    console.log(
      `[ORANGE CALLBACK] Fulfilled order ${payment.order.id} — ${result.ticketCount} tickets`
    )
    return NextResponse.json({ received: true })
  }

  if (rawStatus === "FAILED" || rawStatus === "FAIL") {
    if (payment.order) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        }),
        prisma.order.update({
          where: { id: payment.order.id },
          data: { status: "FAILED" },
        }),
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
    console.log(
      `[ORANGE CALLBACK] Payment failed — reason: ${message ?? "unknown"}`
    )
    return NextResponse.json({ received: true })
  }

  // Unknown / intermediate status — acknowledge so Orange does not retry forever
  console.log(`[ORANGE CALLBACK] Unhandled status: ${rawStatus || "(empty)"}`)
  return NextResponse.json({ received: true })
}

export async function POST(req: NextRequest) {
  try {
    return await handleOrangeCallback(req)
  } catch (err) {
    console.error("[ORANGE CALLBACK] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const PUT = POST
