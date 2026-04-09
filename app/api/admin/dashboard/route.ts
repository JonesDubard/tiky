// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !["ADMIN", "ORGANIZER"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    const [
      totalEvents,
      upcomingEvents,
      totalPolls,
      activePolls,
      archivedPolls,
      totalTicketsSold,
      ticketCapacity,
      totalRevenue,
      recentPayments,
      latestPolls,
      upcomingEventsList,
    ] = await Promise.all([
      prisma.event.count({ where: { deletedAt: null } }),
      prisma.event.count({ where: { deletedAt: null, date: { gte: now } } }),
      prisma.poll.count({ where: { deletedAt: null } }),
      prisma.poll.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.poll.count({ where: { deletedAt: { not: null } } }),
      prisma.ticketInstance.count({ where: { status: { in: ["PAID", "USED"] } } }),
      prisma.ticketType.aggregate({ _sum: { quantity: true } }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          event: { select: { title: true } },
        },
      }),
      prisma.poll.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, pollType: true },
      }),
      prisma.event.findMany({
        where: { deletedAt: null, date: { gte: now } },
        orderBy: { date: "asc" },
        take: 6,
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          ticketTypes: {
            select: {
              quantity: true,
              _count: { select: { tickets: { where: { status: { in: ["PAID", "USED"] } } } } },
            },
          },
        },
      }),
    ])

    // Shape upcoming events with sold count and capacity
    const upcomingEventsFormatted = upcomingEventsList.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      location: event.location,
      ticketsSold: event.ticketTypes.reduce((sum, tt) => sum + tt._count.tickets, 0),
      totalCapacity: event.ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0),
    }))

    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      totalPolls,
      activePolls,
      archivedPolls,
      totalTicketsSold,
      totalTicketsAvailable: ticketCapacity._sum.quantity ?? 0,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      recentPayments,
      latestPolls,
      upcomingEventsList: upcomingEventsFormatted,
    })
  } catch (error: any) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}