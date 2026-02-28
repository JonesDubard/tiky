// app/api/webhooks/mtn-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { generateTicketsForOrder } from "lib/tickets/generate"

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("MTN MoMo webhook received:", body)

    const { referenceId, status, financialTransactionId } = body

    if (!referenceId) {
      return NextResponse.json({ error: "Missing referenceId" }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: referenceId },
    })

    if (!payment) {
      console.error("No payment found for referenceId:", referenceId)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (status === "SUCCESSFUL") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          externalId: financialTransactionId,
          processedAt: new Date(),
        },
      })

      if (payment.orderId) {
        // ✅ Generate tickets after successful MTN payment
        await generateTicketsForOrder(payment.orderId)
      }

    } else if (status === "FAILED") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      })

      if (payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "FAILED" },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("MTN webhook error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}