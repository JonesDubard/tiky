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
import {
  isOrangeTestProbe,
  orangeTestProbeResponse,
  parseOrangeCallbackBody,
} from "lib/orange/callback-probe"
import { appendOrangeFailureMetadata } from "lib/orange/payment-metadata"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const NO_STORE = { "Cache-Control": "no-store" }

function callbackJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE })
}

function callbackSummary(body: Record<string, unknown>) {
  const data = body.transactionData as
    | { transactionId?: string; type?: string; txnId?: string }
    | undefined
  const transactionId = data?.transactionId ?? (body.transactionId as string | undefined)
  return {
    status: String(body.status ?? ""),
    transactionId: transactionId ?? "",
    type: data?.type ?? "",
    txnId: data?.txnId ?? (body.txnId as string | undefined) ?? "",
    message: typeof body.message === "string" ? body.message : "",
  }
}

async function handleOrangeCallback(req: NextRequest) {
  const authResult = verifyOrangeCallbackAuth(req.headers.get("authorization"))

  if (authResult === "misconfigured") {
    console.error(
      "[ORANGE CALLBACK] Rejected: ORANGE_CALLBACK_USER/PASS are not set"
    )
    return callbackJson(
      { error: "Callback credentials are not configured" },
      500
    )
  }

  if (authResult === "missing" || authResult === "invalid") {
    console.warn(`[ORANGE CALLBACK] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  const body = await parseOrangeCallbackBody(req)
  const summary = callbackSummary(body)
  console.log(
    `[ORANGE CALLBACK] Received status=${summary.status || "none"} transactionId=${summary.transactionId || "none"} type=${summary.type || "none"}`
  )

  // Orange Developer Portal subscription compliance probe
  if (isOrangeTestProbe(body)) {
    return orangeTestProbeResponse()
  }

  const transactionId: string | undefined =
    (body.transactionData as { transactionId?: string } | undefined)
      ?.transactionId ?? (body.transactionId as string | undefined)

  if (!transactionId) {
    console.warn(
      `[ORANGE CALLBACK] No transactionId status=${summary.status || "none"} message=${summary.message || "none"}`
    )
    return callbackJson({ status: "OK", received: true })
  }

  const payment = await prisma.payment.findUnique({
    where: { providerRef: transactionId },
    include: { order: { include: { tickets: true } } },
  })

  if (!payment) {
    console.warn(`[ORANGE CALLBACK] No payment for ref: ${transactionId}`)
    return callbackJson({ status: "OK", received: true })
  }

  if (payment.status === "COMPLETED" || payment.status === "FAILED") {
    console.log(
      `[ORANGE CALLBACK] Duplicate ignored transactionId=${transactionId} payment=${payment.status}`
    )
    return callbackJson({ status: "OK", received: true })
  }

  const rawStatus = String(body?.status ?? "").toUpperCase()
  const txnId: string | null =
    body?.transactionData?.txnId ?? body?.txnId ?? null
  const message: string | null = body?.message ?? null

  console.log(
    `[ORANGE CALLBACK] outcome=${rawStatus || "UNKNOWN"} transactionId=${transactionId} message=${message ?? ""}`
  )

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
      return callbackJson({ status: "OK", received: true })
    }

    if (!payment.order) {
      console.error(
        `[ORANGE CALLBACK] SUCCESS with no order transactionId=${transactionId} payment=${payment.id}`
      )
      return callbackJson({ error: "Payment has no order" }, 500)
    }

    const result = await issueTicketsForOrder(payment.order.id)
    if (!result.success) {
      console.error(
        `[ORANGE CALLBACK] Fulfillment failed transactionId=${transactionId} order=${payment.order.id} error=${result.error ?? "unknown"}`
      )
      return callbackJson({ error: "Fulfillment failed" }, 500)
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
    return callbackJson({ status: "OK", received: true })
  }

  if (rawStatus === "FAILED" || rawStatus === "FAIL") {
    const failureMetadata = appendOrangeFailureMetadata(
      payment.metadata,
      message
    )
    if (payment.order) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED", metadata: failureMetadata },
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
        data: { status: "FAILED", metadata: failureMetadata },
      })
    }
    console.error(
      `[ORANGE CALLBACK] Payment failed transactionId=${transactionId} reason=${message ?? "unknown"}`
    )
    return callbackJson({ status: "OK", received: true })
  }

  console.error(
    `[ORANGE CALLBACK] Unhandled status=${rawStatus || "empty"} transactionId=${transactionId} message=${message ?? ""}`
  )
  return callbackJson({ status: "OK", received: true })
}

export async function POST(req: NextRequest) {
  try {
    return await handleOrangeCallback(req)
  } catch (err) {
    console.error("[ORANGE CALLBACK] Unhandled error:", err)
    return callbackJson({ error: "Internal server error" }, 500)
  }
}

export const PUT = POST
