// app/api/webhooks/mtn-momo/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { revalidatePath } from "next/cache"

export async function PUT(req: NextRequest) {
  try {
    const { referenceId, status, financialTransactionId } = await req.json()

    const payment = await prisma.payment.findUnique({
      where: { providerRef: referenceId },
      include: { order: { include: { tickets: true } } }
    })

    if (!payment || !payment.order) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    if (status === "SUCCESSFUL") {
      await prisma.$transaction([
        // 1. Update Payment
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED", externalId: financialTransactionId, processedAt: new Date() }
        }),
        // 2. Update Order
        prisma.order.update({
          where: { id: payment.orderId! },
          data: { status: "COMPLETED" }
        }),
        // 3. Update Tickets to PAID (This fixes your Dashboard stats)
        prisma.ticketInstance.updateMany({
          where: { orderId: payment.orderId },
          data: { status: "PAID" }
        })
      ])
    } 
    else if (status === "FAILED" || status === "REJECTED") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } })
        await tx.order.update({ where: { id: payment.orderId! }, data: { status: "FAILED" } })
        await tx.ticketInstance.updateMany({ where: { orderId: payment.orderId }, data: { status: "CANCELLED" } })

        // --- RESTOCK INVENTORY ---
        for (const ticket of payment.order!.tickets) {
          await tx.ticketType.update({
            where: { id: ticket.ticketTypeId },
            data: { quantity: { increment: 1 } }
          })
        }
      })
    }

    revalidatePath("/admin")
    revalidatePath(`/events/${payment.eventId}`)

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}