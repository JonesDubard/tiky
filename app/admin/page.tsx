// app/admin/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboard from "app/admin/components/AdminDasboard";
import OrganizerDashboard from "app/admin/components/OrganizerDashboard";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, name: true, email: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    redirect("/unauthorized");
  }

  if (user.role === "ORGANIZER") {
    const [myEvents, myPollsCount, myOrdersCount, myRevenueAgg] = await Promise.all([
      // FIX 1: _count uses 'ticketTypes' not 'tickets'
      prisma.event.findMany({
        where: { createdById: user.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          date: true,
          published: true,
          _count: { select: { ticketTypes: true } },
        },
      }),
      prisma.poll.count({
        where: { createdById: user.id, deletedAt: null },
      }),
      // FIX 2: relation is lowercase 'event' not 'Event'
      prisma.order.count({
        where: {
          status: "PAID",
          event: { createdById: user.id },
        },
      }),
      // FIX 2: same fix for aggregate
      prisma.order.aggregate({
        where: {
          status: "PAID",
          event: { createdById: user.id },
        },
        _sum: { totalPrice: true },
      }),
    ]);

    const myRevenue = myRevenueAgg._sum?.totalPrice ?? 0;

    return (
      <OrganizerDashboard
        user={user}
        myEvents={myEvents.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date?.toISOString() ?? null,
          published: e.published,
          // FIX 3: use 'ticketTypes' to match _count select above
          ticketsSold: e._count.ticketTypes,
        }))}
        myPollsCount={myPollsCount}
        myOrdersCount={myOrdersCount}
        myRevenue={myRevenue}
      />
    );
  }

  return <AdminDashboard />;
}