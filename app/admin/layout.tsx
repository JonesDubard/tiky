// app/admin/layout.tsx - COMPLETE VERSION
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import AdminSidebar from 'app/(public)/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
  <div className="min-h-screen bg-slate-50">
    <AdminSidebar user={session.user} />
    {/* Change from pl-64 to ml-64 for proper positioning with fixed sidebar */}
    <div className="md:ml-64"> 
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  </div>
)
}