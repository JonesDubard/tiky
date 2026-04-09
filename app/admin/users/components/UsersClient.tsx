"use client"

// app/admin/users/components/UsersClient.tsx
//
// Handles all interactivity:
// - Live search (name, email)
// - Filter by role + status tabs
// - Role toggle (USER ↔ ORGANIZER)
// - Suspend / Unsuspend toggle
// - Optimistic UI updates (instant feedback, reverts on error)

import { useState, useMemo } from "react"
import {
  Search, Crown, Users, Calendar,
  ShieldOff, ShieldCheck, ChevronDown,
  RefreshCw, AlertTriangle,
} from "lucide-react"
import type { UserRow, UserStats } from "../page"

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; badge: string; icon?: React.ElementType }> = {
  ADMIN:     { label: "Admin",     badge: "bg-orange-100 text-orange-700", icon: Crown },
  ORGANIZER: { label: "Organizer", badge: "bg-blue-100 text-blue-700",   icon: Calendar },
  USER:      { label: "User",      badge: "bg-gray-100 text-gray-600",   icon: Users },
}

const FILTER_TABS = [
  { key: "all",        label: "All" },
  { key: "USER",       label: "Users" },
  { key: "ORGANIZER",  label: "Organizers" },
  { key: "suspended",  label: "Suspended" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersClient({
  users: initialUsers,
  stats,
  currentUserId,
}: {
  users: UserRow[]
  stats: UserStats
  currentUserId: string
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    userId: string
    type: "suspend" | "unsuspend" | "promote" | "demote"
  } | null>(null)

  // Live stats derived from current user list (stay in sync after mutations)
  const liveStats = useMemo(() => {
    const s = { admins: 0, organizers: 0, users: 0, suspended: 0, total: users.length }
    for (const u of users) {
      if (u.role === "ADMIN") s.admins++
      else if (u.role === "ORGANIZER") s.organizers++
      else s.users++
      if (u.status === "suspended") s.suspended++
    }
    return s
  }, [users])

  // ── Toast ──────────────────────────────────────────────────────────────

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Filter + search ────────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "suspended" && u.status === "suspended") ||
        (activeTab !== "suspended" && u.role === activeTab)

      return matchesSearch && matchesTab
    })
  }, [users, search, activeTab])

  // ── Role toggle ────────────────────────────────────────────────────────

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ORGANIZER" ? "USER" : "ORGANIZER"
    const user = users.find((u) => u.id === userId)
    if (!user) return

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    setLoadingId(userId)
    setConfirmAction(null)

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update role")
      }

      showToast(
        `${user.name ?? user.email} is now ${newRole === "ORGANIZER" ? "an Organizer" : "a User"}`,
        "success"
      )
    } catch (err) {
      // Revert optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: currentRole } : u))
      )
      showToast(err instanceof Error ? err.message : "Something went wrong", "error")
    } finally {
      setLoadingId(null)
    }
  }

  // ── Suspend / Unsuspend ────────────────────────────────────────────────

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended"
    const user = users.find((u) => u.id === userId)
    if (!user) return

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    )
    setLoadingId(userId)
    setConfirmAction(null)

    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to update status")
      }

      showToast(
        newStatus === "suspended"
          ? `${user.name ?? user.email} has been suspended`
          : `${user.name ?? user.email} has been reinstated`,
        "success"
      )
    } catch (err) {
      // Revert
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: currentStatus } : u))
      )
      showToast(err instanceof Error ? err.message : "Something went wrong", "error")
    } finally {
      setLoadingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.type === "success"
            ? <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Confirm modal */}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          user={users.find((u) => u.id === confirmAction.userId)!}
          onConfirm={() => {
            const u = users.find((x) => x.id === confirmAction.userId)!
            if (confirmAction.type === "suspend" || confirmAction.type === "unsuspend") {
              handleStatusToggle(u.id, u.status)
            } else {
              handleRoleToggle(u.id, u.role)
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {liveStats.total} members · {liveStats.suspended > 0 && (
            <span className="text-red-500 font-medium">{liveStats.suspended} suspended · </span>
          )}
          Manage roles and access
        </p>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Admins"
          value={liveStats.admins}
          icon={Crown}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
          onClick={() => setActiveTab("all")}
        />
        <StatCard
          label="Organizers"
          value={liveStats.organizers}
          icon={Calendar}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          onClick={() => setActiveTab("ORGANIZER")}
          clickable
        />
        <StatCard
          label="Users"
          value={liveStats.users}
          icon={Users}
          iconColor="text-gray-500"
          iconBg="bg-gray-100"
          onClick={() => setActiveTab("USER")}
          clickable
        />
        <StatCard
          label="Suspended"
          value={liveStats.suspended}
          icon={ShieldOff}
          iconColor={liveStats.suspended > 0 ? "text-red-500" : "text-gray-400"}
          iconBg={liveStats.suspended > 0 ? "bg-red-50" : "bg-gray-50"}
          onClick={() => setActiveTab("suspended")}
          clickable
          pulse={liveStats.suspended > 0}
        />
      </div>

      {/* ── Search + Filter bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex px-3 py-2 gap-1 overflow-x-auto">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all" ? liveStats.total
              : tab.key === "suspended" ? liveStats.suspended
              : tab.key === "ORGANIZER" ? liveStats.organizers
              : liveStats.users

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : tab.key === "suspended" && count > 0
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}

          {/* Active filter indicator */}
          {(search || activeTab !== "all") && (
            <button
              onClick={() => { setSearch(""); setActiveTab("all") }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 px-2 whitespace-nowrap"
            >
              Clear all ×
            </button>
          )}
        </div>
      </div>

      {/* ── User list ────────────────────────────────────────────────── */}
      {filteredUsers.length === 0 ? (
        <EmptyState search={search} tab={activeTab} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Mobile: stacked cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <UserCardMobile
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                isLoading={loadingId === user.id}
                onRoleToggle={() =>
                  setConfirmAction({
                    userId: user.id,
                    type: user.role === "ORGANIZER" ? "demote" : "promote",
                  })
                }
                onStatusToggle={() =>
                  setConfirmAction({
                    userId: user.id,
                    type: user.status === "suspended" ? "unsuspend" : "suspend",
                  })
                }
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["User", "Role", "Status", "Orders", "Joined", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === currentUserId}
                    isLoading={loadingId === user.id}
                    onRoleToggle={() =>
                      setConfirmAction({
                        userId: user.id,
                        type: user.role === "ORGANIZER" ? "demote" : "promote",
                      })
                    }
                    onStatusToggle={() =>
                      setConfirmAction({
                        userId: user.id,
                        type: user.status === "suspended" ? "unsuspend" : "suspend",
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">
              Showing {filteredUsers.length} of {liveStats.total} users
              {search && ` matching "${search}"`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconColor, iconBg,
  onClick, clickable = false, pulse = false,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  onClick?: () => void
  clickable?: boolean
  pulse?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 text-left transition-all w-full ${
        clickable ? "hover:border-gray-300 hover:shadow-sm active:scale-[0.98]" : "cursor-default"
      }`}
    >
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 relative`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
        )}
      </div>
      <div>
        <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </button>
  )
}

// ── Shared action buttons ─────────────────────────────────────────────────────

function ActionButtons({
  user,
  isSelf,
  isLoading,
  onRoleToggle,
  onStatusToggle,
  compact = false,
}: {
  user: UserRow
  isSelf: boolean
  isLoading: boolean
  onRoleToggle: () => void
  onStatusToggle: () => void
  compact?: boolean
}) {
  if (isSelf) {
    return <span className="text-xs text-gray-300 italic">You</span>
  }

  if (user.role === "ADMIN") {
    return <span className="text-xs text-gray-300">—</span>
  }

  const isSuspended = user.status === "suspended"

  return (
    <div className={`flex items-center gap-2 ${compact ? "flex-col" : ""}`}>
      {/* Role toggle — only for non-admin, non-self */}
      <button
        onClick={onRoleToggle}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-40 bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
        title={user.role === "ORGANIZER" ? "Demote to User" : "Promote to Organizer"}
      >
        {isLoading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : user.role === "ORGANIZER" ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <Calendar className="w-3 h-3" />
        )}
        {user.role === "ORGANIZER" ? "Demote" : "Make Organizer"}
      </button>

      {/* Suspend / Unsuspend */}
      <button
        onClick={onStatusToggle}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-40 ${
          isSuspended
            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
        }`}
        title={isSuspended ? "Reinstate user" : "Suspend user"}
      >
        {isLoading ? (
          <RefreshCw className="w-3 h-3 animate-spin" />
        ) : isSuspended ? (
          <ShieldCheck className="w-3 h-3" />
        ) : (
          <ShieldOff className="w-3 h-3" />
        )}
        {isSuspended ? "Reinstate" : "Suspend"}
      </button>
    </div>
  )
}

// ── Mobile card ───────────────────────────────────────────────────────────────

function UserCardMobile({
  user, isSelf, isLoading, onRoleToggle, onStatusToggle,
}: {
  user: UserRow
  isSelf: boolean
  isLoading: boolean
  onRoleToggle: () => void
  onStatusToggle: () => void
}) {
  const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG["USER"]
  const RoleIcon = cfg.icon ?? Users
  const isSuspended = user.status === "suspended"

  return (
    <div className={`p-4 ${isSuspended ? "bg-red-50/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.name || "No name"}
              </p>
              {isSelf && (
                <span className="text-xs text-gray-400">(you)</span>
              )}
              {isSuspended && (
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-1.5 py-0.5 rounded-full">
                  Suspended
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Role badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.badge}`}>
          <RoleIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          {user._count.orders} orders · Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
        <ActionButtons
          user={user}
          isSelf={isSelf}
          isLoading={isLoading}
          onRoleToggle={onRoleToggle}
          onStatusToggle={onStatusToggle}
          compact
        />
      </div>
    </div>
  )
}

// ── Desktop table row ─────────────────────────────────────────────────────────

function UserTableRow({
  user, isSelf, isLoading, onRoleToggle, onStatusToggle,
}: {
  user: UserRow
  isSelf: boolean
  isLoading: boolean
  onRoleToggle: () => void
  onStatusToggle: () => void
}) {
  const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG["USER"]
  const RoleIcon = cfg.icon ?? Users
  const isSuspended = user.status === "suspended"

  return (
    <tr className={`transition-colors hover:bg-gray-50 ${isSuspended ? "bg-red-50/20" : ""}`}>
      {/* User */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900">
                {user.name || "No name"}
              </p>
              {isSelf && (
                <span className="text-xs text-gray-400">(you)</span>
              )}
            </div>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
          <RoleIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
          isSuspended
            ? "bg-red-100 text-red-600"
            : "bg-green-100 text-green-700"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-red-500" : "bg-green-500"}`} />
          {isSuspended ? "Suspended" : "Active"}
        </span>
      </td>

      {/* Orders */}
      <td className="px-5 py-4 text-sm text-gray-600">
        {user._count.orders}
      </td>

      {/* Joined */}
      <td className="px-5 py-4 text-sm text-gray-400">
        {new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        })}
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center justify-end">
          <ActionButtons
            user={user}
            isSelf={isSelf}
            isLoading={isLoading}
            onRoleToggle={onRoleToggle}
            onStatusToggle={onStatusToggle}
          />
        </div>
      </td>
    </tr>
  )
}

// ── User avatar ───────────────────────────────────────────────────────────────

function UserAvatar({ user, size }: { user: UserRow; size: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-sm" : "w-9 h-9 text-sm"
  const isSuspended = user.status === "suspended"

  // Get initials: prefer "J D" from "John Doe", fallback to first char of email
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-semibold flex-shrink-0 relative ${
      isSuspended ? "bg-red-100 text-red-500" : "bg-orange-100 text-orange-600"
    }`}>
      {user.image ? (
        <img
          src={user.image}
          alt={user.name ?? user.email}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
      {isSuspended && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <ShieldOff className="w-1.5 h-1.5 text-white" />
        </span>
      )}
    </div>
  )
}

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  action,
  user,
  onConfirm,
  onCancel,
}: {
  action: { type: "suspend" | "unsuspend" | "promote" | "demote" }
  user: UserRow
  onConfirm: () => void
  onCancel: () => void
}) {
  const config = {
    suspend: {
      title: "Suspend this user?",
      body: `${user.name ?? user.email} will lose access to the platform immediately. You can reinstate them at any time.`,
      confirm: "Yes, suspend",
      confirmClass: "bg-red-500 hover:bg-red-600 text-white",
      icon: <ShieldOff className="w-6 h-6 text-red-500" />,
      iconBg: "bg-red-50",
    },
    unsuspend: {
      title: "Reinstate this user?",
      body: `${user.name ?? user.email} will regain full access to the platform.`,
      confirm: "Yes, reinstate",
      confirmClass: "bg-green-500 hover:bg-green-600 text-white",
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      iconBg: "bg-green-50",
    },
    promote: {
      title: "Make Organizer?",
      body: `${user.name ?? user.email} will be able to create and manage events.`,
      confirm: "Yes, promote",
      confirmClass: "bg-blue-500 hover:bg-blue-600 text-white",
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      iconBg: "bg-blue-50",
    },
    demote: {
      title: "Remove Organizer role?",
      body: `${user.name ?? user.email} will be changed back to a regular user.`,
      confirm: "Yes, demote",
      confirmClass: "bg-gray-700 hover:bg-gray-800 text-white",
      icon: <ChevronDown className="w-6 h-6 text-gray-500" />,
      iconBg: "bg-gray-100",
    },
  }[action.type]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-12 h-12 ${config.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
          {config.icon}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">{config.title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{config.body}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${config.confirmClass}`}
          >
            {config.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ search, tab }: { search: string; tab: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700">No users found</p>
      <p className="text-xs text-gray-400 mt-1">
        {search
          ? `No results for "${search}"`
          : tab === "suspended"
          ? "No suspended users — all clear"
          : "No users in this category"}
      </p>
    </div>
  )
}