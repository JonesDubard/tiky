// app/api/admin/orders/[id]/route.ts
// DELETE /api/admin/orders/:id — deletes a single order and all its related data.
//
// Deletion order for FK safety:
//   Votes → TicketInstances → TicketReservations → Payments → Order

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        referenceCode: true,
        tickets: { select: { id: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const ticketIds = order.tickets.map((t) => t.id)

    await prisma.$transaction(async (tx) => {
      // 1. Votes referencing these tickets
      if (ticketIds.length > 0) {
        await tx.vote.deleteMany({
          where: { ticketInstanceId: { in: ticketIds } },
        })
      }

      // 2. Ticket instances
      await tx.ticketInstance.deleteMany({
        where: { orderId },
      })

      // 3. Ticket reservations
      await tx.ticketReservation.deleteMany({
        where: { orderId },
      })

      // 4. Payments
      await tx.payment.deleteMany({
        where: { orderId },
      })

      // 5. Order itself
      await tx.order.delete({
        where: { id: orderId },
      })
    })

    console.log(
      `[ADMIN DELETE] Order ${orderId} (${order.referenceCode ?? "no ref"}) deleted by ${session.user.email}`
    )

    return NextResponse.json({
      success: true,
      message: `Order ${order.referenceCode ?? orderId} deleted.`,
    })
  } catch (error) {
    console.error("[ADMIN DELETE ORDER] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}