// app/profile/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'
import { User, Calendar, Ticket, BarChart } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // If admin, redirect to admin dashboard
  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  }

  // Get user data
  const [user] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        createdAt: true,
        _count: {
  select: {
    reservations: true,
    votes: true,
    orders: true,
  }
}
      }
    })
  ])

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl flex items-center justify-center text-white text-4xl font-bold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{user?.name || 'User'}</h1>
              <p className="text-slate-600 mt-1">{user?.email}</p>
              <p className="text-sm text-slate-500 mt-2">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Ticket className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{user?._count.reservations || 0}</p>
                <p className="text-sm text-slate-600">Reservations</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <BarChart className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{user?._count.votes || 0}</p>
                <p className="text-sm text-slate-600">Votes</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <Calendar className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{user?._count.orders || 0}</p>
                <p className="text-sm text-slate-600">Orders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">My Dashboard</h2>
          <p className="text-slate-600">Your profile page is under construction.</p>
          <p className="text-sm text-slate-500 mt-2">Check back soon for more features!</p>
        </div>
      </div>
    </div>
  )
}