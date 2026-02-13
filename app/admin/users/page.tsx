import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import UsersTable from "components/admin/UsersTable"
import { Users as UsersIcon, Plus } from "lucide-react"
import Link from "next/link"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  
  // Only ADMIN can access users management
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      // ❌ REMOVED: password: true (NEVER select passwords!)
      role: true,
      // ❌ REMOVED: emailVerified: true (doesn't exist in schema)
      image: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          // ✅ FIXED: Use 'events' not 'orders' (orders doesn't exist)
          events: true,
          // ❌ REMOVED: tickets: true (no direct relation in schema)
          // ❌ REMOVED: payments: true (no direct relation in schema)
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  // Transform the data to match what UsersTable expects
  const formattedUsers = users.map(user => ({
    ...user,
    // Add default values for fields that might be expected by UsersTable
    _count: {
      orders: 0, // Mock value since we don't have orders
      tickets: 0, // Mock value since we don't have direct ticket relation
      payments: 0 // Mock value since we don't have direct payment relation
    }
  }))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-6 h-6" />
            Users Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all users in the system
          </p>
        </div>
        <Link 
          href="/admin/users/create"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-md transition-shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Admins</div>
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === "ADMIN").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Organizers</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === "ORGANIZER").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600">Regular Users</div>
          <div className="text-2xl font-bold text-emerald-600">
            {users.filter(u => u.role === "USER").length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <UsersTable users={formattedUsers} />
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-sm text-yellow-800">
          💡 <span className="font-medium">Note:</span> As admin, you can promote users to admin/organizer roles or demote them.
        </p>
      </div>
    </div>
  )
}