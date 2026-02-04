import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { DollarSign, Filter, Download } from 'lucide-react'

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const payments = await prisma.payment.findMany({
    include: {
      user: { select: { email: true, name: true } },
      event: { select: { title: true } },
      ticket: { select: { type: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600 mt-2">Monitor all transactions and revenue</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-medium text-slate-600">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-medium text-slate-600">Total Payments</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{payments.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-medium text-slate-600">Completed</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {payments.filter(p => p.status === 'COMPLETED').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm font-medium text-slate-600">Pending</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {payments.filter(p => p.status === 'PENDING').length}
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-900">Transaction ID</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-900">Customer</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-900">Event</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="py-4 px-6 text-left text-sm font-semibold text-slate-900">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <code className="text-sm font-mono text-slate-700">{payment.providerRef || payment.id.slice(0, 8)}</code>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-900">{payment.user?.name || payment.user?.email || 'Guest'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-900">{payment.event?.title || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{payment.ticket?.type}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">${Number(payment.amount).toLocaleString()}</div>
                      <div className="text-xs text-slate-500">{payment.currency}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-800'
                          : payment.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">No payments yet</h3>
              <p className="text-slate-500 mt-2">Transactions will appear here once users start purchasing tickets</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
