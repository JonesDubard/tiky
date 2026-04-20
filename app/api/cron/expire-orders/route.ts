import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function GET(req: Request) {
  // 🔐 Protect with secret
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const now = new Date()

    // Find expired orders that are still pending
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "PENDING_CONFIRMATION",
        expiresAt: { lt: now },
      },
      include: {
        tickets: { select: { id: true, ticketTypeId: true } },
      },
    })

    if (expiredOrders.length === 0) {
      return NextResponse.json({ message: "No expired orders found" })
    }

    // Process each expired order: restore quantities, mark order cancelled, delete ticket instances
    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        // Restore ticket quantities
        for (const ticket of order.tickets) {
          await tx.ticketType.update({
            where: { id: ticket.ticketTypeId },
            data: { quantity: { increment: 1 } },
          })
        }

        // Delete the reserved ticket instances
        await tx.ticketInstance.deleteMany({
          where: { orderId: order.id },
        })

        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        })
      })

      console.log(`[CRON] Cancelled expired order ${order.id} (ref: ${order.referenceCode})`)
    }

    return NextResponse.json({ cancelled: expiredOrders.length })
  } catch (error) {
    console.error("[CRON] Error expiring orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}