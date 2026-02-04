// app/admin/page.tsx - DASHBOARD HOME
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import StatCard from 'components/admin/StatCard'
import { Calendar, BarChart, Ticket, Users, TrendingUp, DollarSign } from 'lucide-react'

async function getDashboardStats() {
  const [
    totalEvents,
    featuredEvents,
    totalPolls,
    activePolls,
    totalTickets,
    ticketsSold,
    totalUsers,
    recentPayments,
    revenue
  ] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { isFeatured: true } }),
    prisma.poll.count(),
    prisma.poll.count({ where: { status: 'ACTIVE' } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { quantity: { gt: 0 } } }),
    prisma.user.count(),
    prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { email: true } },
        event: { select: { title: true } }
      }
    }),
    // Calculate revenue from completed payments
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    })
  ])

  return { 
    totalEvents, 
    featuredEvents, 
    totalPolls, 
    activePolls, 
    totalTickets, 
    ticketsSold,
    totalUsers,
    recentPayments,
    revenue: revenue._sum.amount || 0
  }
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const stats = await getDashboardStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pt-0"> {/* Add pt-0 */}
      <div className="max-w-7xl mx-auto pt-4"> {/* Add pt-4 instead of margin */}
        {/* Header - Add mt-0 to remove any top margin */}
        <div className="mb-8 mt-0"> {/* Add mt-0 */}
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600 mt-2">Welcome back, {session.user.name || session.user.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Events</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalEvents}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  <span className="font-semibold">{stats.featuredEvents}</span> featured
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Polls</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activePolls}</p>
                <p className="text-xs text-slate-500 mt-1">Total: {stats.totalPolls}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <BarChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Tickets</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalTickets}</p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold">{stats.ticketsSold}</span> available
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Ticket className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  ${stats.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">LRD</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="/admin/events/create" 
                className="group p-4 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Create Event</h3>
                    <p className="text-sm text-slate-500">Add new event with tickets</p>
                  </div>
                </div>
              </a>

              <a 
                href="/admin/polls/create" 
                className="group p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                    <BarChart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Create Poll</h3>
                    <p className="text-sm text-slate-500">Launch new voting poll</p>
                  </div>
                </div>
              </a>

              <a 
                href="/admin/payments" 
                className="group p-4 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">View Payments</h3>
                    <p className="text-sm text-slate-500">Monitor transactions</p>
                  </div>
                </div>
              </a>

              <a 
                href="/admin/users" 
                className="group p-4 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200">
                    <Users className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Manage Users</h3>
                    <p className="text-sm text-slate-500">View all registered users</p>
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Payments</h2>
            {stats.recentPayments.length > 0 ? (
              <div className="space-y-4">
                {stats.recentPayments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">${payment.amount}</p>
                      <p className="text-xs text-slate-500">
                        {payment.event?.title || 'Event'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : payment.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        {payment.user?.email?.split('@')[0] || 'User'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No payments yet</p>
                <p className="text-sm text-slate-400 mt-1">Transactions will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Events</h2>
            <a href="/admin/events" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all →
            </a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Event</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Tickets</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        Liberian Music Festival Vol. {i}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Published
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">2 types</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <a 
                          href={`/admin/events/edit/${i}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </a>
                        <button className="text-sm text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}