// app/api/admin/analytics/route.ts
//
// FIXES from previous version:
// 1. `activeUsers` now counts users where status = "active" (not totalUsers)
// 2. Revenue growth formula handles zero-last-month correctly
// 3. `topEventsRaw` uses `_count` instead of loading all ticket records into memory
// 4. ORGANIZER role can access (page was blocking them; API was allowing them — now consistent)
// 5. `import { authOptions } from "lib/auth"` — correct import path

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
      totalTickets,
      monthlyTickets,
      lastMonthTickets,
      totalUsers,
      activeUsers,         // FIX 1: was totalUsers, now filtered by status
      newUsersThisMonth,
      newUsersLastMonth,
      totalEvents,
      activeEvents,
      totalPolls,
      activePolls,
      recentSales,
      topEventsRaw,
      salesOverTimeRaw,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),

      prisma.ticketInstance.count({ where: { status: "PAID" } }),
      prisma.ticketInstance.count({
        where: { status: "PAID", createdAt: { gte: startOfMonth } },
      }),
      prisma.ticketInstance.count({
        where: {
          status: "PAID",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),

      prisma.user.count(),

      // FIX 1: count only non-suspended users
      prisma.user.count({ where: { status: "active" } }),

      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),

      prisma.event.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null, date: { gte: now } } }),

      prisma.poll.count({ where: { deletedAt: null } }),
      prisma.poll.count({ where: { deletedAt: null, status: "ACTIVE" } }),

      prisma.payment.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
        },
      }),

      // FIX 3: use _count instead of loading all ticket records into memory
      prisma.ticketType.findMany({
        where: { event: { deletedAt: null } },
        select: {
          price: true,
          event: { select: { id: true, title: true } },
          _count: {
            select: {
              tickets: { where: { status: { in: ["PAID", "USED"] } } },
            },
          },
        },
      }),

      prisma.ticketInstance.findMany({
        where: {
          status: "PAID",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          createdAt: true,
          ticketType: { select: { price: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ])

    // ── Growth calculations ─────────────────────────────────────────────────

    const rev = totalRevenue._sum.amount ?? 0
    const monthRev = monthlyRevenue._sum.amount ?? 0
    const lastRev = lastMonthRevenue._sum.amount ?? 0

    // FIX 2: handle zero-last-month cleanly
    const revenueGrowth =
      lastRev > 0
        ? Math.round(((monthRev - lastRev) / lastRev) * 100)
        : monthRev > 0
        ? 100   // First sales ever = 100% growth
        : 0

    const tickGrowth =
      lastMonthTickets > 0
        ? Math.round(((monthlyTickets - lastMonthTickets) / lastMonthTickets) * 100)
        : monthlyTickets > 0
        ? 100
        : 0

    const userGrowth =
      newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : newUsersThisMonth > 0
        ? 100
        : 0

    // ── Top events ──────────────────────────────────────────────────────────
    // FIX 3: use _count.tickets (integer) instead of .tickets.length (array)

    const eventMap: Record<
      string,
      { id: string; title: string; sales: number; revenue: number }
    > = {}

    for (const tt of topEventsRaw) {
      const key = tt.event.id
      if (!eventMap[key]) {
        eventMap[key] = {
          id: tt.event.id,
          title: tt.event.title,
          sales: 0,
          revenue: 0,
        }
      }
      const soldCount = tt._count.tickets  // now a number, not an array
      eventMap[key].sales += soldCount
      eventMap[key].revenue += soldCount * tt.price
    }

    const topEvents = Object.values(eventMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)

    // ── Sales over time grouped by day ──────────────────────────────────────

    const dayMap: Record<string, { count: number; revenue: number }> = {}
    for (const t of salesOverTimeRaw) {
      const day = t.createdAt.toISOString().split("T")[0]
      if (!dayMap[day]) dayMap[day] = { count: 0, revenue: 0 }
      dayMap[day].count++
      dayMap[day].revenue += t.ticketType.price
    }

    const salesOverTime = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: v.count,
        revenue: v.revenue,
      }))

    return NextResponse.json({
      summary: {
        totalRevenue: rev,
        monthlyRevenue: monthRev,
        revenueGrowth,
        totalTickets,
        monthlyTickets,
        ticketsGrowth: tickGrowth,
        totalUsers,
        activeUsers,          // FIX 1: now accurate
        newUsersThisMonth,
        userGrowth,
        totalEvents,
        activeEvents,
        totalPolls,
        activePolls,
      },
      recentSales: recentSales.map((s) => ({
        id: s.id,
        amount: s.amount,
        createdAt: s.createdAt,
        user: s.user ?? { name: null, email: "Guest" },
        event: s.event ?? { title: "Unknown" },
      })),
      topEvents,
      salesOverTime,
    })
  } catch (error: unknown) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    )
  }
}