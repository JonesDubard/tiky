// app/api/events/[id]/latest-transaction/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = params.id

    console.log("Fetching latest payment for event:", eventId)

    const payment = await prisma.payment.findFirst({
      where: {
        eventId: eventId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!payment) {
      return NextResponse.json(
        { message: "No payment found", payment: null },
        { status: 200 }
      )
    }

    const response = {
      payment: {
        id: payment.id,
        providerRef: payment.providerRef,
        externalId: payment.externalId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        processedAt: payment.processedAt,
        createdAt: payment.createdAt,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching latest payment:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch payment",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}