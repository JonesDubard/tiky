// app/api/admin/orders/[id]/reject/route.ts
// Admin rejects a manual payment order.


import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await req.json().catch(() => ({}))
    const reason: string = body.reason?.trim() || "Payment could not be verified"

    // ── Load order with everything we need to reverse ──────────────────────
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          select: { id: true, status: true },
        },
        payments: {
          select: { id: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // ── Guard: only reject orders that are in a rejectable state ───────────
    // COMPLETED is allowed here intentionally — covers the "undo accidental
    // approval" case. REJECTED is blocked to prevent double-processing.
    const rejectableStatuses = [
      "AWAITING_APPROVAL",
      "PENDING_CONFIRMATION",
      "PENDING",
      "COMPLETED",   // ← undo an accidental approval
    ]
    if (!rejectableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Order is ${order.status} and cannot be rejected` },
        { status: 400 }
      )
    }

    // ── Determine which tickets need to be cancelled ───────────────────────
    // RESERVED  → never issued, just cancel
    // PAID      → was issued (approved), reverse it
    // USED      → already scanned at door, do not cancel (integrity)
    const cancellableTickets = order.tickets.filter(
      (t) => t.status === "RESERVED" || t.status === "PAID"
    )
    const usedTicketCount = order.tickets.filter((t) => t.status === "USED").length

    if (usedTicketCount > 0) {
      // Partial reversal warning — log it but still proceed with the rest
      console.warn(
        `[ADMIN REJECT] Order ${orderId} has ${usedTicketCount} already-scanned ticket(s). Those will NOT be cancelled.`
      )
    }

    // ── Atomic reversal ────────────────────────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // 1. Cancel all reversible tickets and wipe QR image
      if (cancellableTickets.length > 0) {
        await tx.ticketInstance.updateMany({
          where: {
            id: { in: cancellableTickets.map((t) => t.id) },
          },
          data: {
            status: "CANCELLED",
            qrImage: null,   // remove issued QR so cancelled tickets can't be used
          },
        })
      }

      // 2. Mark order as REJECTED
      //    Store reason in proofNote prefixed so it's readable in the UI
      //    (the orders page already checks for "REJECTED:" prefix to hide it
      //    from the TX ID display)
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "REJECTED",
          ticketGenerated: false,
          proofNote: `REJECTED: ${reason}`,
        },
      })

      // 3. Mark all payments on this order as FAILED
      if (order.payments.length > 0) {
        await tx.payment.updateMany({
          where: { orderId },
          data: {
            status: "FAILED",
            processedAt: new Date(),
          },
        })
      }
    })

    console.log(
      `[ADMIN REJECT] Order ${orderId} (${order.referenceCode}) rejected by ${session.user.email}. ` +
      `Reason: "${reason}". ${cancellableTickets.length} ticket(s) cancelled.` +
      (usedTicketCount > 0 ? ` ${usedTicketCount} already-used ticket(s) left intact.` : "")
    )

    return NextResponse.json({
      success: true,
      cancelledTickets: cancellableTickets.length,
      skippedUsedTickets: usedTicketCount,
      message: `Order rejected. ${cancellableTickets.length} ticket(s) cancelled.`,
    })
  } catch (error) {
    console.error("[ADMIN REJECT] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}