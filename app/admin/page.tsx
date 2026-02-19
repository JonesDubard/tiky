import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Get dashboard statistics
  const [
    totalEvents,
    totalPolls,
    activePolls,
    totalTicketsSold,
    availableTickets,
    totalRevenue
  ] = await Promise.all([
    prisma.event.count({
  where: {
    deletedAt: null
  }
}),
    prisma.poll.count(),
    prisma.poll.count({ where: { status: 'ACTIVE' } }),
    prisma.ticketInstance.count({ where: { status: 'PAID' } }),
    prisma.ticketType.aggregate({
      _sum: { quantity: true }
    }).then(r => r._sum.quantity || 0),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    }).then(r => r._sum.amount || 0)
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Events" 
          value={totalEvents} 
          icon="📅"
        />
        <StatCard 
          title="Active Polls" 
          value={activePolls} 
          subtitle={`Total: ${totalPolls}`}
          icon="📊"
        />
        <StatCard 
          title="Tickets Sold" 
          value={totalTicketsSold} 
          subtitle={`${availableTickets} available`}
          icon="🎫"
        />
        <StatCard 
          title="Total Revenue" 
          value={`${totalRevenue.toLocaleString()} LRD`} 
          icon="💰"
        />
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Tips</h2>
        <ul className="space-y-2 text-blue-800">
          <li>• Create events and sell tickets with MTN MoMo payment integration.</li>
          <li>• Launch polls to engage your audience and collect feedback.</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }: { 
  title: string; 
  value: string | number;
  subtitle?: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
}