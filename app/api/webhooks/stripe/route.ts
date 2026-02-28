import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "lib/prisma"
import { generateTicketsForOrder } from "lib/tickets/generate"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Stripe webhook signature failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("Stripe webhook event:", event.type)

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent
    const { orderId, paymentId, quantities: quantitiesJson } = intent.metadata

    // ✅ Parse quantities from metadata
    const quantities = quantitiesJson
      ? JSON.parse(quantitiesJson) as Record<string, number>
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

      // ✅ Pass quantities so tickets can be generated without reservations
      await generateTicketsForOrder(orderId, quantities)

    } catch (err: any) {
      console.error("Error processing Stripe success:", err)
      return NextResponse.json({ error: err.message }, { status: 500 })
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