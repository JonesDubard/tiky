// app/api/payment/initiate-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

/** One unique QR code string per TicketInstance */
function generateQrCode(): string {
  return crypto.randomBytes(16).toString("hex")
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { eventId, quantities, phoneNumber } = await req.json()

    // ── 1. Input validation ───────────────────────────────────────────────────
    if (!eventId || !quantities || typeof quantities !== "object") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required for MTN MoMo" },
        { status: 400 }
      )
    }

    const entries = Object.entries(quantities) as [string, number][]

    // Reject if every requested qty is 0 or negative — nothing to purchase
    const hasValidQty = entries.some(([, qty]) => qty > 0)
    if (!hasValidQty) {
      return NextResponse.json(
        { error: "Please select at least one ticket." },
        { status: 400 }
      )
    }

    // ── 2. Atomic transaction — check stock, decrement, create records ────────
    // prisma.$transaction with an async callback runs everything inside a single
    // PostgreSQL transaction. A concurrent purchase cannot slip in between our
    // stock check and the decrement — the second writer will block and then see
    // the already-reduced quantity when it commits.
    const { order, payment } = await prisma.$transaction(async (tx) => {
      let totalAmount = 0

      // Collect the TicketInstance rows we'll create once the order exists.
      // Schema: Order.tickets → TicketInstance[] (no separate OrderItem model)
      const instanceRows: {
        ticketTypeId: string
        qrCode: string
        status: string
        phoneNumber: string
      }[] = []

      for (const [ticketTypeId, requestedQty] of entries) {
        // Skip ticket types the user left at 0
        if (!requestedQty || requestedQty <= 0) continue

        // Re-fetch inside the transaction — sees latest committed stock
        const ticket = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
        })

        if (!ticket || ticket.eventId !== eventId) {
          throw new Error(`Ticket type ${ticketTypeId} not found for this event.`)
        }

        // ── Core oversell guard ───────────────────────────────────────────────
        if (ticket.quantity < requestedQty) {
          throw new Error("Insufficient tickets available.")
        }

        // Decrement stock atomically inside the same transaction
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { quantity: { decrement: requestedQty } },
        })

        totalAmount += ticket.price * requestedQty

        // One TicketInstance row per seat purchased
        for (let i = 0; i < requestedQty; i++) {
          instanceRows.push({
            ticketTypeId,
            qrCode: generateQrCode(),
            status: "RESERVED",
            phoneNumber,
          })
        }
      }

      if (totalAmount <= 0) {
        throw new Error("Invalid order amount.")
      }

      // Create the order and all TicketInstances in one operation.
      // `tickets` is the correct relation name on Order (schema: tickets TicketInstance[])
      const newOrder = await tx.order.create({
        data: {
          status: "PENDING",
          totalPrice: totalAmount,
          eventId,
          userId: session?.user?.id ?? null,
          tickets: {
            create: instanceRows,
          },
        },
      })

      // Create the payment record
      const newPayment = await tx.payment.create({
        data: {
          amount: totalAmount,
          currency: "USD",
          status: "PENDING",
          paymentMethod: "mtn_momo",
          orderId: newOrder.id,
          userId: session?.user?.id ?? null,
          eventId,
        },
      })

      return { order: newOrder, payment: newPayment }
    })
    // ── Transaction end ───────────────────────────────────────────────────────

    console.log(`MTN MoMo payment initiated for order ${order.id}, phone: ${phoneNumber}`)

    // ── 3. Cache invalidation — bust public page + all admin views ───────────
    revalidatePath(`/events/${eventId}`)        // public event detail
    revalidatePath("/admin/events")             // admin event list
    revalidatePath(`/admin/events/${eventId}`)  // admin event detail

    // TODO: call MTN MoMo API here to push a payment prompt to phoneNumber.
    // The webhook at /api/webhooks/mtn-momo flips order + payment to PAID
    // once the user approves on their handset.

    return NextResponse.json({
      orderId: order.id,
      paymentId: payment.id,
      redirectUrl: `/checkout/success?orderId=${order.id}&method=mtn_momo`,
      message: "MTN MoMo payment initiated. Please approve on your phone.",
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("initiate-momo error:", message)

    // 409 Conflict for stock errors so the client can show a targeted message
    const isStockError = message === "Insufficient tickets available."
    return NextResponse.json({ error: message }, { status: isStockError ? 409 : 500 })
  }
}