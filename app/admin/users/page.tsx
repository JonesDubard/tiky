"use client"

import { useState, useEffect } from "react"
import {
  Search, Shield, UserX, UserCheck, Users,
  ChevronDown, RefreshCw, CheckCircle, XCircle
} from "lucide-react"

interface User {
  id: string
  name: string | null
  email: string
  role: "USER" | "ORGANIZER" | "ADMIN"
  status: "active" | "suspended"
  createdAt: string
  eventsCount?: number
  image?: string | null
}

const roleBadge: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800 border border-purple-200",
  ORGANIZER: "bg-blue-100 text-blue-800 border border-blue-200",
  USER: "bg-gray-100 text-gray-700 border border-gray-200",
}

const roleDescription: Record<string, string> = {
  USER: "Can browse and purchase tickets",
  ORGANIZER: "Can create and manage their own events",
  ADMIN: "Full access to admin dashboard",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [pendingRole, setPendingRole] = useState<{ userId: string; role: string } | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenDropdown(null)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(data)
    } catch {
      showToast("Failed to load users", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setPendingRole({ userId, role: newRole })
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as User["role"] } : u))
      showToast(`User promoted to ${newRole}`, "success")
    } catch {
      showToast("Failed to update role", "error")
    } finally {
      setPendingRole(null)
      setOpenDropdown(null)
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active"
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as User["status"] } : u))
      showToast(`User ${newStatus === "active" ? "activated" : "suspended"}`, "success")
    } catch {
      showToast("Failed to update status", "error")
    }
  }

  const filteredUsers = users.filter(u => {
    const name = u.name ?? ""
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || u.role === selectedRole
    return matchesSearch && matchesRole
  })

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === "ADMIN").length,
    organizer: users.filter(u => u.role === "ORGANIZER").length,
    user: users.filter(u => u.role === "USER").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 text-green-600" />
            : <XCircle className="w-4 h-4 text-red-600" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Promote users to organizers or manage access</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: counts.total, color: "text-gray-900" },
          { label: "Admins", value: counts.admin, color: "text-purple-600" },
          { label: "Organizers", value: counts.organizer, color: "text-blue-600" },
          { label: "Regular Users", value: counts.user, color: "text-gray-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Role info banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-900 mb-1">Role Permissions</p>
            <div className="space-y-1">
              {Object.entries(roleDescription).map(([role, desc]) => (
                <p key={role} className="text-xs text-orange-700">
                  <span className="font-medium">{role}:</span> {desc}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="USER">User</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {["User", "Role", "Status", "Joined", "Events", "Actions"].map(h => (
                <th key={h} className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                {/* User */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt={user.name ?? ""} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                        {(user.name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name || "—"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role — dropdown */}
                <td className="px-6 py-4">
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 ${roleBadge[user.role]}`}
                      disabled={pendingRole?.userId === user.id}
                    >
                      {pendingRole?.userId === user.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Shield className="w-3 h-3" />
                      )}
                      {user.role}
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {openDropdown === user.id && (
                      <div className="absolute left-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-gray-200 min-w-[180px] overflow-hidden">
                        {(["USER", "ORGANIZER", "ADMIN"] as const).map(role => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(user.id, role)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                              user.role === role ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700"
                            }`}
                          >
                            <div className="font-medium">{role}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{roleDescription[role]}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {user.status === "active" ? "Active" : "Suspended"}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                {/* Events */}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.eventsCount ?? 0}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`p-2 rounded-lg transition-colors ${
                      user.status === "active"
                        ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                        : "text-green-400 hover:text-green-600 hover:bg-green-50"
                    }`}
                    title={user.status === "active" ? "Suspend user" : "Activate user"}
                  >
                    {user.status === "active"
                      ? <UserX className="w-4 h-4" />
                      : <UserCheck className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No users found</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        {filteredUsers.length} of {users.length} users
      </p>
    </div>
  )
}