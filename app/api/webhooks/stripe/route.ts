import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "lib/prisma"
import { generateTicketsForOrder } from "lib/tickets/generate"

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Stripe webhook signature failed:", message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("Stripe webhook event:", event.type)

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent
    const { orderId, paymentId, quantities: quantitiesJson } = intent.metadata

    const quantities = quantitiesJson
      ? (JSON.parse(quantitiesJson) as Record<string, number>)
      : undefined

    console.log("Stripe payment succeeded for order:", orderId)

    try {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          externalId: intent.id,
          processedAt: new Date(),
        },
      })
      await generateTicketsForOrder(orderId, quantities)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Error processing Stripe success:", message)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent
    const { orderId, paymentId } = intent.metadata

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED" },
    })
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    })
  }

  return NextResponse.json({ received: true })
}