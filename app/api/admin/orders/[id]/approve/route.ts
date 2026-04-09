// app/api/admin/orders/[id]/approve/route.ts
//
// Admin approves a manual payment.
// Triggers ticket issuance (QR generation) and marks order COMPLETED.

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import { issueTicketsForOrder } from "lib/manual-payment"

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

    // Verify order is in approvable state
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        referenceCode: true,
        totalPrice: true,
        paymentMethod: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const approvableStatuses = ["AWAITING_APPROVAL", "PENDING_CONFIRMATION", "REJECTED"]
    if (!approvableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Order is already ${order.status} and cannot be approved` },
        { status: 400 }
      )
    }

    // Issue tickets — generates QR images and marks tickets PAID
    const result = await issueTicketsForOrder(orderId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to issue tickets" },
        { status: 500 }
      )
    }

    console.log(
      `[ADMIN APPROVE] Order ${orderId} (${order.referenceCode}) approved by ${session.user.email}. ${result.ticketCount} tickets issued.`
    )

    return NextResponse.json({
      success: true,
      ticketCount: result.ticketCount,
      message: `Approved. ${result.ticketCount} ticket(s) issued.`,
    })
  } catch (error) {
    console.error("[ADMIN APPROVE] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}