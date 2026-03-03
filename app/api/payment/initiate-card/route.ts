// app/api/payment/initiate-card/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import Stripe from "stripe"

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { eventId, quantities, email } = await req.json()

    if (!eventId || !quantities || typeof quantities !== "object") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch ticket types for this event
    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId },
    })

    if (!ticketTypes.length) {
      return NextResponse.json({ error: "No tickets found for this event" }, { status: 404 })
    }

    // Calculate total
    let totalAmount = 0
    for (const [ticketTypeId, qty] of Object.entries(quantities)) {
      const ticket = ticketTypes.find((t) => t.id === ticketTypeId)
      if (ticket) {
        totalAmount += ticket.price * (qty as number)
      }
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 })
    }

    const totalCents = Math.round(totalAmount * 100)

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        totalPrice: totalAmount,
        eventId,
        userId: session?.user?.id ?? null,
      },
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: totalAmount,
        currency: "usd",
        status: "PENDING",
        paymentMethod: "card",
        orderId: order.id,
        userId: session?.user?.id ?? null,
        eventId,
      },
    })

    // Create Stripe PaymentIntent
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      receipt_email: email ?? undefined,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        quantities: JSON.stringify(quantities),
      },
    })

    // Store Stripe reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: { externalId: paymentIntent.id },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("initiate-card error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
