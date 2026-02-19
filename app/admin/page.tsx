// import { prisma } from "lib/prisma";
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";

// export default async function AdminDashboard() {
//   const session = await getServerSession();

//   if (!session?.user) {
//     redirect("/admin/login");
//   }

//   // Get dashboard statistics
//   const [
//     totalEvents,
//     totalPolls,
//     activePolls,
//     totalTicketsSold,
//     availableTickets,
//     totalRevenue
//   ] = await Promise.all([
//     prisma.event.count({
//   where: {
//     deletedAt: null
//   }
// }),
//     prisma.poll.count(),
//     prisma.poll.count({ where: { status: 'ACTIVE' } }),
//     prisma.ticketInstance.count({ where: { status: 'PAID' } }),
//     prisma.ticketType.aggregate({
//       _sum: { quantity: true }
//     }).then(r => r._sum.quantity || 0),
//     prisma.payment.aggregate({
//       where: { status: 'COMPLETED' },
//       _sum: { amount: true }
//     }).then(r => r._sum.amount || 0)
//   ]);

//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//         <StatCard 
//           title="Total Events" 
//           value={totalEvents} 
//           icon="📅"
//         />
//         <StatCard 
//           title="Active Polls" 
//           value={activePolls} 
//           subtitle={`Total: ${totalPolls}`}
//           icon="📊"
//         />
//         <StatCard 
//           title="Tickets Sold" 
//           value={totalTicketsSold} 
//           subtitle={`${availableTickets} available`}
//           icon="🎫"
//         />
//         <StatCard 
//           title="Total Revenue" 
//           value={`${totalRevenue.toLocaleString()} LRD`} 
//           icon="💰"
//         />
//       </div>

//       {/* Quick Tips */}
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
//         <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Tips</h2>
//         <ul className="space-y-2 text-blue-800">
//           <li>• Create events and sell tickets with MTN MoMo payment integration.</li>
//           <li>• Launch polls to engage your audience and collect feedback.</li>
//         </ul>
//       </div>
//     </div>
//   );
// }

// function StatCard({ title, value, subtitle, icon }: { 
//   title: string; 
//   value: string | number;
//   subtitle?: string;
//   icon: string;
// }) {
//   return (
//     <div className="bg-white rounded-lg shadow p-6">
//       <div className="flex items-center justify-between mb-2">
//         <h3 className="text-sm font-medium text-gray-500">{title}</h3>
//         <span className="text-2xl">{icon}</span>
//       </div>
//       <p className="text-3xl font-bold text-gray-900">{value}</p>
//       {subtitle && (
//         <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
//       )}
//     </div>
//   );
// }

// app/admin/page.tsx
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/admin/login");
  }

  // Dashboard statistics
  const [
    totalEvents,
    totalPolls,
    activePolls,
    archivedPolls,
    totalTicketsSold,
    availableTickets,
    totalRevenue,
    latestEvents,
    latestPolls
  ] = await Promise.all([
    prisma.event.count({ where: { deletedAt: null } }),
    prisma.poll.count({ where: { deletedAt: null } }),
    prisma.poll.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
    prisma.poll.count({ where: { deletedAt: { not: null } } }),
    prisma.ticketInstance.count({ where: { status: 'PAID' } }),
    prisma.ticketType.aggregate({ _sum: { quantity: true } }).then(r => r._sum.quantity || 0),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }).then(r => r._sum.amount || 0),
    prisma.event.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.poll.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, pollType: true },
    }),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Quick Action Buttons */}
      <div className="flex justify-start gap-4 mb-6">
        <Link
          href="/admin/events/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>

        <Link
          href="/admin/polls/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Poll
        </Link>

        {/* <Link
          href="/admin/polls/archive"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          🗑
          Archived Polls
        </Link> */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Events" value={totalEvents} icon="📅" />
        <StatCard title="Total Polls" value={totalPolls} icon="📊" />
        <StatCard title="Active Polls" value={activePolls} subtitle={`Archived: ${archivedPolls}`} icon="✅" />
        <StatCard title="Tickets Sold" value={totalTicketsSold} subtitle={`${availableTickets} available`} icon="🎫" />
        <StatCard title="Total Revenue" value={`${totalRevenue.toLocaleString()} USD`} icon="💰" />
      </div>

      {/* Latest Events */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Latest Events</h2>
        <ul className="divide-y divide-gray-200">
          {latestEvents.map(event => (
            <li key={event.id} className="py-2 flex justify-between items-center">
              <span>{event.title}</span>
              <span className="text-sm text-gray-500">{new Date(event.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Latest Polls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Latest Polls</h2>
        <ul className="divide-y divide-gray-200">
          {latestPolls.map(poll => (
            <li key={poll.id} className="py-2 flex justify-between items-center">
              <span>{poll.title}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                poll.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {poll.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Tips</h2>
        <ul className="space-y-2 text-blue-800">
          <li>• Create events and sell tickets with MTN MoMo payment integration.</li>
          <li>• Launch polls to engage your audience and collect feedback.</li>
          <li>• Soft-deleted polls and events appear in their respective archive pages.</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon
}: {
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
