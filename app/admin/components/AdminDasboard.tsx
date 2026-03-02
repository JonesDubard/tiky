"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, RefreshCw, Ticket, DollarSign, Calendar, BarChart2 } from "lucide-react"

type DashboardData = {
  totalEvents: number
  upcomingEvents: number
  totalPolls: number
  activePolls: number
  archivedPolls: number
  totalTicketsSold: number
  totalTicketsAvailable: number
  totalRevenue: number
  recentPayments: {
    id: string
    amount: number
    paymentMethod: string
    status: string
    createdAt: string
    user: { name: string | null; email: string } | null
    event: { title: string } | null
  }[]
  latestPolls: {
    id: string
    title: string
    status: string
    pollType: string
  }[]
  upcomingEventsList: {
    id: string
    title: string
    date: string
    location: string
    ticketsSold: number
    totalCapacity: number
  }[]
}

const METHOD_LABEL: Record<string, string> = {
  card: "Card",
  mtn_momo: "MTN MoMo",
  orange_money: "Orange",
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/admin/dashboard")
      if (!res.ok) throw new Error("Failed to load dashboard")
      const json = await res.json()
      setData(json)
      // Use string to avoid hydration mismatch
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500">
        Failed to load dashboard.{" "}
        <button onClick={() => fetchData()} className="text-orange-500 underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">Last updated {lastUpdated}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <Link
            href="/admin/events/create"
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Event</span>
          </Link>
          <Link
            href="/admin/polls/create"
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Poll</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-500" />}
          label="Events"
          value={data.totalEvents}
          sub={`${data.upcomingEvents} upcoming`}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<BarChart2 className="w-5 h-5 text-purple-500" />}
          label="Polls"
          value={data.totalPolls}
          sub={`${data.activePolls} active`}
          bg="bg-purple-50"
        />
        <StatCard
          icon={<Ticket className="w-5 h-5 text-orange-500" />}
          label="Tickets Sold"
          value={data.totalTicketsSold}
          sub={`of ${data.totalTicketsAvailable}`}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
          label="Revenue"
          value={`$${data.totalRevenue.toFixed(2)}`}
          sub="USD"
          bg="bg-green-50"
        />
      </div>

      {/* Quick nav on mobile */}
      <div className="grid grid-cols-3 gap-2 mb-6 md:hidden">
        {[
          { href: "/admin/tickets", label: "Tickets", emoji: "🎫" },
          { href: "/admin/orders", label: "Orders", emoji: "📦" },
          { href: "/admin/users", label: "Users", emoji: "👥" },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-100 shadow-sm text-center hover:border-orange-200 transition-all"
          >
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium text-gray-600">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm md:text-base">Recent Payments</h2>
            <Link href="/admin/orders" className="text-xs text-orange-500 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentPayments.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No payments yet</div>
            ) : (
              data.recentPayments.map(p => (
                <div key={p.id} className="px-4 md:px-5 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.user?.name || p.user?.email || "Guest"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{p.event?.title || "Unknown event"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="font-bold text-gray-900 text-sm">${p.amount.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      p.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm md:text-base">Upcoming Events</h2>
            <Link href="/admin/events" className="text-xs text-orange-500 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.upcomingEventsList.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No upcoming events</div>
            ) : (
              data.upcomingEventsList.map(event => {
                const soldPct = event.totalCapacity > 0
                  ? Math.round((event.ticketsSold / event.totalCapacity) * 100)
                  : 0
                return (
                  <div key={event.id} className="px-4 md:px-5 py-3">
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {event.ticketsSold}/{event.totalCapacity}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          soldPct > 80 ? "bg-red-400" :
                          soldPct > 50 ? "bg-yellow-400" :
                          "bg-orange-400"
                        }`}
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Latest Polls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm md:text-base">Latest Polls</h2>
          <Link href="/admin/polls" className="text-xs text-orange-500 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data.latestPolls.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No polls yet</div>
          ) : (
            data.latestPolls.map(poll => (
              <div key={poll.id} className="px-4 md:px-5 py-3 flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700 truncate">{poll.title}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                  poll.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {poll.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, sub, bg,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  bg: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xl md:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs md:text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}