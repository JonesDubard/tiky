import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get current date and date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Run all queries in parallel
    const [
      totalRevenue,
      monthlyRevenue,
      totalTickets,
      monthlyTickets,
      activeUsers,
      newUsersThisMonth,
      recentSales,
      topEvents,
      salesOverTime,
    ] = await Promise.all([
      // Total revenue (all time)
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" }
      }),

      // Monthly revenue
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth }
        }
      }),

      // Total tickets sold (all time)
      prisma.ticketInstance.count({
        where: { status: { in: ["PAID", "USED"] } }
      }),

      // Monthly tickets sold
      prisma.ticketInstance.count({
        where: {
          status: { in: ["PAID", "USED"] },
          createdAt: { gte: startOfMonth }
        }
      }),

      // Active users (users with activity in last 30 days)
      prisma.user.count({
        where: {
          OR: [
            { orders: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { events: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { payments: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
          ]
        }
      }),

      // New users this month
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      }),

      // Recent sales (last 5 transactions)
      prisma.payment.findMany({
        where: { status: "COMPLETED" },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          event: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }),

      // Top events by revenue
      prisma.event.findMany({
        select: {
          id: true,
          title: true,
          _count: { select: { payments: true } },
          payments: {
            where: { status: "COMPLETED" },
            select: { amount: true }
          }
        },
        orderBy: { payments: { _count: "desc" } },
        take: 5
      }),

      // Sales over time (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count,
          SUM(amount) as revenue
        FROM Payment
        WHERE status = 'COMPLETED'
          AND createdAt >= datetime('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
    ]);

    // Format top events data
    const formattedTopEvents = topEvents.map(event => ({
      id: event.id,
      title: event.title,
      sales: event._count.payments,
      revenue: event.payments.reduce((sum, p) => sum + p.amount, 0)
    }));

    // Calculate growth percentages
    const lastMonthRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: lastMonth,
          lt: startOfMonth
        }
      }
    });

    const revenueGrowth = lastMonthRevenue._sum.amount 
      ? ((monthlyRevenue._sum.amount! - lastMonthRevenue._sum.amount) / lastMonthRevenue._sum.amount) * 100
      : 0;

    return NextResponse.json({
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalTickets: totalTickets,
        monthlyTickets: monthlyTickets,
        ticketsGrowth: monthlyTickets > 0 ? Math.round((monthlyTickets / totalTickets) * 100) : 0,
        totalUsers: activeUsers + newUsersThisMonth,
        activeUsers: activeUsers,
        newUsersThisMonth: newUsersThisMonth,
        userGrowth: activeUsers > 0 ? Math.round((newUsersThisMonth / activeUsers) * 100) : 0,
      },
      recentSales,
      topEvents: formattedTopEvents,
      salesOverTime: salesOverTime || [],
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}