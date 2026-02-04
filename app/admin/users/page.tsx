// app/admin/users/page.tsx
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
      password: true,
      role: true,
      emailVerified: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          orders: true,
          tickets: true,
          payments: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

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
        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-md transition-shadow">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          <div className="text-sm text-gray-600">Regular Users</div>
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === "USER").length}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <UsersTable users={users} />
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <p className="text-sm text-yellow-800">
          💡 <span className="font-medium">Note:</span> As admin, you can promote users to admin role or demote them.
        </p>
      </div>
    </div>
  )
}