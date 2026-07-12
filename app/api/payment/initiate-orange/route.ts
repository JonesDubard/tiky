import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { revalidatePath } from "next/cache"
import { normalisePhone } from "lib/momo"
import {
  getOrangeCurrency,
  initiateDebit,
  toOrangePeerId,
} from "lib/orange/client"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()

    const {
      eventId,
      quantities,
      phoneNumber,
    }: {
      eventId: string
      quantities: Record<string, number>
      phoneNumber: string
    } = body

    if (!eventId || !quantities || !phoneNumber) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: eventId, quantities, phoneNumber",
        },
        { status: 400 }
      )
    }

    const msisdn = normalisePhone(phoneNumber)
    if (!msisdn) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number. Enter your Orange Money number e.g. 0770000000",
        },
        { status: 400 }
      )
    }

    const peerId = toOrangePeerId(msisdn)
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0)
    if (entries.length === 0) {
      return NextResponse.json({ error: "No tickets selected" }, { status: 400 })
    }

    const transactionId = crypto.randomUUID()

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0
      const ticketInstances: {
        ticketTypeId: string
        qrCode: string
        status: string
        phoneNumber: string
      }[] = []

      for (const [ticketTypeId, requestedQty] of entries) {
        const ticketType = await tx.ticketType.findUnique({
          where: { id: ticketTypeId },
          select: {
            id: true,
            price: true,
            quantity: true,
            name: true,
            eventId: true,
          },
        })

        if (!ticketType) {
          throw new Error(`Ticket type not found: ${ticketTypeId}`)
        }
        if (ticketType.eventId !== eventId) {
          throw new Error("Ticket type does not belong to this event")
        }
        if (ticketType.quantity < requestedQty) {
          throw new Error(
            `Only ${ticketType.quantity} ticket${
              ticketType.quantity !== 1 ? "s" : ""
            } remaining for "${ticketType.name}"`
          )
        }

        totalAmount += ticketType.price * requestedQty
        for (let i = 0; i < requestedQty; i++) {
          ticketInstances.push({
            ticketTypeId,
            qrCode: crypto.randomBytes(20).toString("hex"),
            status: "RESERVED",
            phoneNumber: msisdn,
          })
        }
      }

      const order = await tx.order.create({
        data: {
          status: "PENDING",
          totalPrice: totalAmount,
          eventId,
          userId: session?.user?.id ?? undefined,
          paymentMethod: "orange_money",
          tickets: { create: ticketInstances },
        },
      })

      await tx.payment.create({
        data: {
          providerRef: transactionId,
          amount: totalAmount,
          currency: "USD",
          status: "PENDING",
          paymentMethod: "orange_money",
          orderId: order.id,
          eventId,
          userId: session?.user?.id ?? undefined,
        },
      })

      return { order, totalAmount }
    })

    try {
      await initiateDebit({
        transactionId,
        amount: result.totalAmount.toFixed(2),
        peerId,
        currency: getOrangeCurrency(),
      })
    } catch (orangeError) {
      console.error("[ORANGE] debit failed:", orangeError)

      const payment = await prisma.payment.findFirst({
        where: { providerRef: transactionId },
      })

      if (payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          })
          await tx.order.update({
            where: { id: payment.orderId! },
            data: { status: "FAILED" },
          })
          await tx.ticketInstance.updateMany({
            where: { orderId: payment.orderId },
            data: { status: "CANCELLED" },
          })
        })
      }

      return NextResponse.json(
        {
          error:
            "Could not reach Orange Money. Check your phone number and try again.",
        },
        { status: 502 }
      )
    }

    revalidatePath(`/events/${eventId}`)
    console.log(`[ORANGE] debit sent — Order: ${result.order.id}`)

    return NextResponse.json({
      orderId: result.order.id,
      referenceId: transactionId,
      redirectUrl: `/checkout/pending?orderId=${result.order.id}&method=orange_money`,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error"
    console.error("[ORANGE] initiate error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
