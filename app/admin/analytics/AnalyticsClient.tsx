"use client"

// app/admin/analytics/AnalyticsClient.tsx
//
// FIXES from previous version:
// 1. Page header restored — refresh button was orphaned without it
// 2. "Active Users" sparkline removed — was fabricated data
// 3. "Active Events" sparkline removed — was fabricated data
// 4. Only sparklines backed by real `salesOverTime` data are shown
// 5. Refresh button moved into the header row where it belongs

import { useState, useEffect, useCallback } from "react"
import {
  DollarSign, Ticket, Users, Calendar,
  ArrowUp, ArrowDown, RefreshCw, TrendingUp,
  BarChart2, Activity,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  summary: {
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    totalTickets: number
    monthlyTickets: number
    ticketsGrowth: number
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    userGrowth: number
    totalEvents: number
    activeEvents: number
    totalPolls: number
    activePolls: number
  }
  recentSales: Array<{
    id: string
    amount: number
    createdAt: string
    user: { name: string | null; email: string }
    event: { title: string }
  }>
  topEvents: Array<{
    id: string
    title: string
    sales: number
    revenue: number
  }>
  salesOverTime: Array<{
    date: string
    count: number
    revenue: number
  }>
}

// ── Mini charts ───────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#f97316" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return <div className="h-10 w-24" />
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 96
  const h = 40
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline
        points={pts}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MiniBar({ data, color = "#f97316" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return <div className="h-10 w-24" />
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-0.5 h-10 w-24">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm opacity-80"
          style={{ height: `${(v / max) * 100}%`, backgroundColor: color }}
        />
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  growth,
  icon: Icon,
  iconBg,
  iconColor,
  sparkData,
  sparkColor,
  chartType = "line",
}: {
  title: string
  value: string | number
  subtitle?: string
  growth?: number
  icon: React.ElementType
  iconBg: string
  iconColor: string
  sparkData?: number[]
  sparkColor?: string
  chartType?: "line" | "bar"
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {sparkData && sparkData.length >= 2 && (
          chartType === "line"
            ? <Sparkline data={sparkData} color={sparkColor} />
            : <MiniBar data={sparkData} color={sparkColor} />
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {growth !== undefined && (
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            growth >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {growth >= 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )}
          {Math.abs(growth)}% vs last month
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch("/api/admin/analytics")
      if (!res.ok) throw new Error("Failed to load analytics")
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error("Analytics error:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-3">Failed to load analytics</p>
        <button
          onClick={() => fetchAnalytics()}
          className="text-sm text-orange-500 hover:text-orange-600 font-medium underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const s = data.summary

  // Sparklines — only from real salesOverTime data
  // FIX 4: no fabricated sparklines for users or events
  const last10 = data.salesOverTime.slice(-10)
  const revSpark = last10.map((d) => d.revenue)
  const tickSpark = last10.map((d) => d.count)

  const topBarColor = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b"]

  return (
    <div className="space-y-6">

      {/* ── Page header with refresh ──────────────────────────────────── */}
      {/* FIX 1: header restored — refresh button was orphaned without it */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Platform performance overview
          </p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Main stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue — sparkline backed by real data */}
        <StatCard
          title="Total Revenue"
          value={`$${s.totalRevenue.toFixed(2)}`}
          subtitle={`$${s.monthlyRevenue.toFixed(2)} this month`}
          growth={s.revenueGrowth}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          sparkData={revSpark}
          sparkColor="#16a34a"
          chartType="line"
        />

        {/* Tickets — bar chart backed by real data */}
        <StatCard
          title="Tickets Sold"
          value={s.totalTickets}
          subtitle={`${s.monthlyTickets} this month`}
          growth={s.ticketsGrowth}
          icon={Ticket}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          sparkData={tickSpark}
          sparkColor="#f97316"
          chartType="bar"
        />

        {/* Users — no sparkline (FIX 4: removed fabricated data) */}
        <StatCard
          title="Total Users"
          value={s.totalUsers}
          subtitle={`+${s.newUsersThisMonth} this month · ${s.activeUsers} active`}
          growth={s.userGrowth}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        {/* Events — no sparkline (FIX 4: removed fabricated data) */}
        <StatCard
          title="Upcoming Events"
          value={s.activeEvents}
          subtitle={`${s.totalEvents} total events`}
          icon={Calendar}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* ── Secondary stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events",  value: s.totalEvents,  icon: "📅" },
          { label: "Active Polls",  value: s.activePolls,  icon: "📊" },
          { label: "Total Polls",   value: s.totalPolls,   icon: "🗳️" },
          { label: "Active Users",  value: s.activeUsers,  icon: "👥" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sales over time ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Sales Over Time</h3>
          <span className="text-xs text-gray-400 ml-auto">
            Last {data.salesOverTime.length} days
          </span>
        </div>

        {data.salesOverTime.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No sales data yet</p>
        ) : (
          <div className="space-y-6">
            {/* Revenue bars */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Revenue
              </p>
              <div className="flex items-end gap-1 h-24">
                {data.salesOverTime.map((d, i) => {
                  const max = Math.max(...data.salesOverTime.map((x) => x.revenue), 1)
                  return (
                    <div key={i} className="flex-1 group relative">
                      <div
                        className="w-full rounded-t bg-orange-400 hover:bg-orange-500 transition-colors cursor-default"
                        style={{ height: `${(d.revenue / max) * 96}px` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {d.date}: ${d.revenue.toFixed(0)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{data.salesOverTime[0]?.date}</span>
                <span>{data.salesOverTime[data.salesOverTime.length - 1]?.date}</span>
              </div>
            </div>

            {/* Ticket count bars */}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Tickets sold
              </p>
              <div className="flex items-end gap-1 h-12">
                {data.salesOverTime.map((d, i) => {
                  const max = Math.max(...data.salesOverTime.map((x) => x.count), 1)
                  return (
                    <div key={i} className="flex-1 group relative">
                      <div
                        className="w-full rounded-t bg-blue-300 hover:bg-blue-400 transition-colors cursor-default"
                        style={{ height: `${(d.count / max) * 48}px` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {d.date}: {d.count} ticket{d.count !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Top events + Recent transactions ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top events */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Top Events</h3>
          </div>

          {data.topEvents.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No event data yet</p>
          ) : (
            <div className="space-y-4">
              {data.topEvents.map((event, i) => {
                const maxSales = Math.max(...data.topEvents.map((e) => e.sales), 1)
                const pct = (event.sales / maxSales) * 100
                return (
                  <div key={event.id}>
                    <div className="flex justify-between text-sm mb-1.5 gap-2">
                      <span className="text-gray-700 truncate max-w-[60%] font-medium">
                        {event.title}
                      </span>
                      <span className="text-gray-400 text-xs flex-shrink-0">
                        {event.sales} ticket{event.sales !== 1 ? "s" : ""} ·{" "}
                        ${event.revenue.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: topBarColor[i % topBarColor.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          </div>

          {data.recentSales.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No transactions yet</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentSales.slice(0, 8).map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sale.user.name || sale.user.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{sale.event.title}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      ${sale.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(sale.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}