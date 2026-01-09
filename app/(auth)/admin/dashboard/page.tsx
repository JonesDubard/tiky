// app/(auth)/admin/dashboard/page.tsx - SERVER COMPONENT
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER')) {
    redirect('/login')
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
      <p>Welcome, {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Quick Stats</h3>
          <p>Coming soon...</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          <p>No recent activity</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
            Create Event
          </button>
        </div>
      </div>
    </div>
  )
}
