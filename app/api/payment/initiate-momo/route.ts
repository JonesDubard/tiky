// app/api/payment/initiate-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { eventId, quantities, phoneNumber } = await req.json()

    if (!eventId || !quantities) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const entries = Object.entries(quantities) as [string, number][]
    
    // Create the reference here
    const providerRef = `MOMO-${crypto.randomBytes(4).toString("hex").toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const instanceRows = []

      for (const [ticketTypeId, requestedQty] of entries) {
        if (requestedQty <= 0) continue

        const ticketType = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
        })

        if (!ticketType || ticketType.quantity < requestedQty) {
          throw new Error("Insufficient tickets available.")
        }

        // ATOMIC DECREMENT
        await tx.ticketType.update({
          where: { id: ticketTypeId },
          data: { quantity: { decrement: requestedQty } },
        })

        totalAmount += ticketType.price * requestedQty

        for (let i = 0; i < requestedQty; i++) {
          instanceRows.push({
            ticketTypeId,
            qrCode: crypto.randomBytes(16).toString("hex"),
            status: "RESERVED",
            phoneNumber,
          })
        }
      }

      const newOrder = await tx.order.create({
        data: {
          status: "PENDING",
          totalPrice: totalAmount,
          eventId,
          userId: session?.user?.id ?? null,
          tickets: { create: instanceRows },
        },
      })

      const newPayment = await tx.payment.create({
        data: {
          providerRef: providerRef,
          amount: totalAmount,
          currency: "USD",
          status: "PENDING",
          paymentMethod: "mtn_momo",
          orderId: newOrder.id,
          eventId: eventId,
          userId: session?.user?.id ?? null,
        },
      })

      return { order: newOrder, providerRef }
    })

    // THIS IS WHAT YOU NEED FOR THUNDER CLIENT
    console.log("------------------------------------------")
    console.log("NEW MOMO TRANSACTION INITIATED")
    console.log("Order ID:", result.order.id)
    console.log("Provider Reference:", result.providerRef) 
    console.log("------------------------------------------")

    revalidatePath(`/events/${eventId}`)
    
    return NextResponse.json({
      orderId: result.order.id,
      providerRef: result.providerRef, // This also shows up in the "Response" tab of your browser
      redirectUrl: `/checkout/success?orderId=${result.order.id}`,
    })
  } catch (error: any) {
    console.error("MOMO ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}