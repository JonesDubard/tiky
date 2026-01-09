// app/(auth)/admin/layout.tsx - WITH SIDEBAR
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/app/(public)/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  // Redirect if not logged in
  if (!session) {
    redirect('/login')
  }
  
  // Check if user has admin/organizer role
  const userRole = session.user?.role || 'USER'
  if (userRole !== 'ADMIN' && userRole !== 'ORGANIZER') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={session.user} />
      
      {/* Main content area */}
      <div className="md:pl-64">
        {/* Mobile header */}
        <header className="md:hidden bg-white shadow">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Tikky Admin</h1>
                <p className="text-sm text-gray-600 truncate">
                  {session.user?.email}
                </p>
              </div>
              <div className="text-xs px-2 py-1 bg-gray-100 rounded-md">
                {userRole}
              </div>
            </div>
            
            {/* Mobile navigation */}
            <div className="mt-3 flex space-x-2 overflow-x-auto pb-1">
              <a href="/admin" className="text-sm px-3 py-1 bg-gray-100 rounded-md whitespace-nowrap">
                Dashboard
              </a>
              <a href="/admin/events" className="text-sm px-3 py-1 bg-gray-100 rounded-md whitespace-nowrap">
                Events
              </a>
              <a href="/admin/polls" className="text-sm px-3 py-1 bg-gray-100 rounded-md whitespace-nowrap">
                Polls
              </a>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
