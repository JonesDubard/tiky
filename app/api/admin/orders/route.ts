// app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// ── Auth helper ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session
}

// ── GET /api/admin/orders ──────────────────────────────────────────────────────
// Unchanged from original — returns full order list for the admin UI.

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")
    ) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search") ?? ""

    const orders = await prisma.order.findMany({
      where: {
        ...(status && status !== "all" ? { status } : {}),
        ...(search
          ? {
              OR: [
                { id: { contains: search, mode: "insensitive" } },
                { referenceCode: { contains: search, mode: "insensitive" } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { user: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        totalPrice: true,
        ticketGenerated: true,
        createdAt: true,
        referenceCode: true,
        proofUrl: true,
        proofNote: true,
        paymentMethod: true,
        user: {
          select: { id: true, name: true, email: true },
        },
        tickets: {
          select: {
            id: true,
            status: true,
            ticketType: {
              select: {
                name: true,
                price: true,
                event: {
                  select: { id: true, title: true, date: true },
                },
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paymentMethod: true,
            processedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// ── DELETE /api/admin/orders ───────────────────────────────────────────────────
// "Clear all" — deletes every order and all related data.
// ADMIN only (not ORGANIZER — this is irreversible).
//
// Deletion order matters for FK constraints:
//   Votes (reference TicketInstance) → TicketInstances → TicketReservations
//   → Payments → Orders
//
// Body: { confirm: "DELETE_ALL" } — required as an extra safety gate.

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))

    if (body.confirm !== "DELETE_ALL") {
      return NextResponse.json(
        { error: "Missing confirmation. Send { confirm: 'DELETE_ALL' } to proceed." },
        { status: 400 }
      )
    }

    // Collect all order IDs and their ticket IDs first
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        tickets: { select: { id: true } },
      },
    })

    const orderIds   = orders.map((o) => o.id)
    const ticketIds  = orders.flatMap((o) => o.tickets.map((t) => t.id))

    if (orderIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: "No orders to delete." })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete votes linked to those ticket instances
      if (ticketIds.length > 0) {
        await tx.vote.deleteMany({
          where: { ticketInstanceId: { in: ticketIds } },
        })
      }

      // 2. Delete ticket instances
      await tx.ticketInstance.deleteMany({
        where: { orderId: { in: orderIds } },
      })

      // 3. Delete ticket reservations
      await tx.ticketReservation.deleteMany({
        where: { orderId: { in: orderIds } },
      })

      // 4. Delete payments
      await tx.payment.deleteMany({
        where: { orderId: { in: orderIds } },
      })

      // 5. Delete orders
      await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      })
    })

    console.log(
      `[ADMIN CLEAR ALL] ${orderIds.length} orders deleted by ${session.user.email}`
    )

    return NextResponse.json({
      success: true,
      deleted: orderIds.length,
      message: `Deleted ${orderIds.length} order(s) and all related records.`,
    })
  } catch (error) {
    console.error("[ADMIN DELETE ALL] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}