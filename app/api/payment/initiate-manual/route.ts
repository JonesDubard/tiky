// app/api/payment/initiate-manual/route.ts
//
// Handles order creation for ALL manual payment methods:
// - MTN MoMo
// - Orange Money
// - Bank Transfer (replaces Stripe for launch)
//
// Flow:
// 1. Validate request
// 2. Decrement ticket quantities (atomic)
// 3. Create Order + TicketInstances (RESERVED) + Payment (PENDING)
// 4. Return orderId + referenceCode → client redirects to /checkout/pending

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { revalidatePath } from "next/cache"
import { generateUniqueReferenceCode } from "lib/manual-payment"
import crypto from "crypto"

type ManualPaymentMethod = "mtn_momo" | "orange_money" | "bank_transfer"

const VALID_METHODS: ManualPaymentMethod[] = [
  "mtn_momo",
  "orange_money",
  "bank_transfer",
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    const {
      eventId,
      quantities, // Record<ticketTypeId, quantity>
      phoneNumber,
      paymentMethod,
    }: {
      eventId: string
      quantities: Record<string, number>
      phoneNumber?: string
      paymentMethod: ManualPaymentMethod
    } = body

    // ── Validation ────────────────────────────────────────────────────────────

    if (!eventId || !quantities || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, quantities, paymentMethod" },
        { status: 400 }
      )
    }

    if (!session?.user?.id) {
      const hasTokenGatedPoll = await prisma.poll.findFirst({
    where: {
      eventId,
      status: "ACTIVE",
      pollType: "TOKEN_GATED",
      deletedAt: null,
    },
    select: { id: true },
  });
  if (hasTokenGatedPoll) {
    return NextResponse.json(
      {
        error: "This event requires login to vote. Please log in before purchasing tickets.",
      },
      { status: 401 }
    );
  }
}

    if (!VALID_METHODS.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${VALID_METHODS.join(", ")}` },
        { status: 400 }
      )
    }

    if (
      (paymentMethod === "mtn_momo" || paymentMethod === "orange_money") &&
      !phoneNumber
    ) {
      return NextResponse.json(
        { error: "Phone number is required for mobile money payments" },
        { status: 400 }
      )
    }

    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0)

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No tickets selected" },
        { status: 400 }
      )
    }

    // ── Generate reference code (before transaction, retry-safe) ──────────────

    const referenceCode = await generateUniqueReferenceCode()

    // ── Atomic transaction ────────────────────────────────────────────────────

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const ticketInstancesToCreate: {
        ticketTypeId: string
        qrCode: string
        status: string
        phoneNumber: string | undefined
      }[] = []

      for (const [ticketTypeId, requestedQty] of entries) {
        // Lock the row and verify availability
        const ticketType = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
          select: { id: true, price: true, quantity: true, name: true, eventId: true },
        })

        if (!ticketType) {
          throw new Error(`Ticket type ${ticketTypeId} not found`)
        }

        if (ticketType.eventId !== eventId) {
          throw new Error(`Ticket type does not belong to this event`)
        }

        if (ticketType.quantity < requestedQty) {
          throw new Error(
            `Only ${ticketType.quantity} tickets remaining for "${ticketType.name}"`
          )
        }

        // Atomic decrement
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { quantity: { decrement: requestedQty } },
        })

        totalAmount += ticketType.price * requestedQty

        // Queue ticket instances for creation
        for (let i = 0; i < requestedQty; i++) {
          ticketInstancesToCreate.push({
            ticketTypeId,
            // Unique QR code string — scanned at the venue
            qrCode: crypto.randomBytes(20).toString("hex"),
            status: "RESERVED",
            phoneNumber,
          })
        }
      }

      // Create the order
      const order = await tx.order.create({
        data: {
          status: "PENDING_CONFIRMATION", // Custom status for manual payment flow
          totalPrice: totalAmount,
          eventId,
          userId: session?.user?.id ?? null,
          referenceCode,
          paymentMethod,
          tickets: {
            create: ticketInstancesToCreate,
          },
        },
      })

      // Create the payment record
      await tx.payment.create({
        data: {
          providerRef: referenceCode, // Use reference code as provider ref
          amount: totalAmount,
          currency: "USD",
          status: "PENDING",
          paymentMethod,
          orderId: order.id,
          eventId,
          userId: session?.user?.id ?? null,
        },
      })

      return { orderId: order.id, referenceCode, totalAmount }
    })

    // Revalidate event page so ticket counts update
    revalidatePath(`/events/${eventId}`)

    console.log(`[MANUAL PAYMENT] Created order ${result.orderId} | Ref: ${result.referenceCode} | Method: ${paymentMethod} | Amount: $${result.totalAmount}`)

    return NextResponse.json({
      orderId: result.orderId,
      referenceCode: result.referenceCode,
      redirectUrl: `/checkout/pending?orderId=${result.orderId}`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("[MANUAL PAYMENT] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}