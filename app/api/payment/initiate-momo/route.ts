import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { revalidatePath } from "next/cache"
import { requestToPay, normalisePhone } from "lib/momo"
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
            "Invalid phone number. Enter your MTN MoMo number e.g. 0880000000",
        },
        { status: 400 }
      )
    }

    const entries = Object.entries(quantities).filter(
      ([, qty]) => qty > 0
    )

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No tickets selected" },
        { status: 400 }
      )
    }

    const referenceId = crypto.randomUUID()

    // =========================================================
    // CREATE ORDER + RESERVED TICKETS
    // DO NOT DECREMENT INVENTORY HERE
    // =========================================================

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
          throw new Error(
            `Ticket type not found: ${ticketTypeId}`
          )
        }

        if (ticketType.eventId !== eventId) {
          throw new Error(
            "Ticket type does not belong to this event"
          )
        }

        // ONLY VALIDATE AVAILABILITY
        // DO NOT DECREMENT YET
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
          paymentMethod: "mtn_momo",

          tickets: {
            create: ticketInstances,
          },
        },
      })

      await tx.payment.create({
        data: {
          providerRef: referenceId,
          amount: totalAmount,
          currency: "USD",
          status: "PENDING",
          paymentMethod: "mtn_momo",
          orderId: order.id,
          eventId,
          userId: session?.user?.id ?? undefined,
        },
      })

      return {
        order,
        totalAmount,
      }
    })

    // =========================================================
    // SEND MTN PAYMENT REQUEST
    // =========================================================

    try {
      await requestToPay({
        referenceId,
        amount: result.totalAmount.toFixed(2),
        currency: "USD",
        partyId: msisdn,
        payerMessage: "Tiky ticket payment",
        payeeNote: "Ticket purchase",
      })
    } catch (momoError) {
      console.error(
        "[MOMO RAW ERROR]",
        JSON.stringify(
          momoError,
          Object.getOwnPropertyNames(momoError)
        )
      )

      const message =
        momoError instanceof Error
          ? momoError.message
          : "MoMo request failed"

      console.error(
        "[MOMO] requesttopay failed:",
        message
      )

      // ============================================
      // MARK EVERYTHING FAILED/CANCELLED
      // ============================================

      const payment = await prisma.payment.findFirst({
        where: {
          providerRef: referenceId,
        },
      })

      if (payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: "FAILED",
            },
          })

          await tx.order.update({
          where: { id: payment.orderId! },
          data: { status: "FAILED" },
         });

          await tx.ticketInstance.updateMany({
            where: {
              orderId: payment.orderId,
            },
            data: {
              status: "CANCELLED",
            },
          })
        })
      }

      return NextResponse.json(
        {
          error:
            "Could not reach MTN MoMo. Check your phone number and try again.",
        },
        { status: 502 }
      )
    }

    revalidatePath(`/events/${eventId}`)

    console.log(
      `[MOMO] requesttopay sent — Order: ${result.order.id}`
    )

    return NextResponse.json({
      orderId: result.order.id,
      referenceId,
      redirectUrl: `/checkout/pending?orderId=${result.order.id}&method=mtn_momo`,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error"

    console.error("[MOMO] initiate error:", message)

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}