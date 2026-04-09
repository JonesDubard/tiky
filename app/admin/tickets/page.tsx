// app/admin/tickets/page.tsx
//
// FIXES from previous version:
// 1. Stats derived from single DB query → no sync issues
// 2. RESERVED count added (critical for manual payment flow)
// 3. Revenue calculated here, passed to client
// 4. ORGANIZER role allowed through (matches admin layout)
// 5. Stats passed as props → client can keep them in sync
// 6. Removed unnecessary $transaction on reads
// 7. Validate Tickets CTA lives in the page header, not buried in client

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"
import Link from "next/link"
import { ScanLine } from "lucide-react"
import TicketsClient from "./TicketsClients"

export const dynamic = "force-dynamic"

export default async function TicketsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect("/login")

  // Allow ADMIN and ORGANIZER — matches the admin layout guard
  const role = session.user.role
  if (role !== "ADMIN" && role !== "ORGANIZER") {
    redirect("/unauthorized")
  }

  // ── Single query for all stats ──────────────────────────────────────────
  // Group by status so we hit the DB once, not five times.
  // Prisma returns: [{ status: "PAID", _count: { _all: 42 } }, ...]
  const statusGroups = await prisma.ticketInstance.groupBy({
    by: ["status"],
    _count: { _all: true },
  })

  const countByStatus: Record<string, number> = {}
  for (const group of statusGroups) {
    countByStatus[group.status] = group._count._all
  }

  const total = Object.values(countByStatus).reduce((a, b) => a + b, 0)
  const reserved = countByStatus["RESERVED"] ?? 0
  const paid = countByStatus["PAID"] ?? 0
  const used = countByStatus["USED"] ?? 0
  const cancelled = countByStatus["CANCELLED"] ?? 0

  // ── Revenue from PAID + USED tickets ───────────────────────────────────
  // Fetch ticket prices and sum in JavaScript (Prisma cannot aggregate over relations)
  const paidTickets = await prisma.ticketInstance.findMany({
    where: { status: { in: ["PAID", "USED"] } },
    select: { ticketType: { select: { price: true } } },
  })
  const revenue = paidTickets.reduce((sum, t) => sum + (t.ticketType?.price ?? 0), 0)

  const stats = { total, reserved, paid, used, cancelled, revenue }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Ticket Management
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total.toLocaleString()} tickets across all events
            </p>
          </div>

          {/* Primary CTA — visible and prominent */}
          <Link
            href="/admin/tickets/validate"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            Scan & Validate
          </Link>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">

          {/* Revenue — most important number */}
          <div className="md:col-span-2 bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Revenue
              </p>
              <p className="text-2xl font-black text-white mt-0.5">
                ${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
          </div>

          {/* RESERVED — amber, pulses if > 0 */}
          <StatCard
            label="Reserved"
            value={reserved}
            color={reserved > 0 ? "amber" : "gray"}
            pulse={reserved > 0}
            hint={reserved > 0 ? "Awaiting payment" : "None pending"}
          />

          {/* PAID */}
          <StatCard label="Confirmed" value={paid} color="green" />

          {/* USED */}
          <StatCard label="Used" value={used} color="blue" />

          {/* CANCELLED */}
          <StatCard label="Cancelled" value={cancelled} color="red" />
        </div>
      </div>

      {/* ── Tickets table (client component) ─────────────────────────── */}
      {/* Stats passed as props so the client can wire filter clicks to them */}
      <div className="p-6">
        <TicketsClient initialStats={stats} />
      </div>
    </div>
  )
}

// ── Stat card sub-component ───────────────────────────────────────────────────

type StatColor = "green" | "blue" | "amber" | "red" | "gray"

const colorMap: Record<StatColor, { bg: string; text: string; dot: string }> = {
  green: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  gray: { bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" },
}

function StatCard({
  label,
  value,
  color,
  pulse = false,
  hint,
}: {
  label: string
  value: number
  color: StatColor
  pulse?: boolean
  hint?: string
}) {
  const c = colorMap[color]
  return (
    <div className={`${c.bg} rounded-xl px-4 py-3`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className={`w-2 h-2 rounded-full ${c.dot} ${pulse ? "animate-pulse" : ""}`}
        />
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className={`text-2xl font-black ${c.text}`}>{value.toLocaleString()}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  )
}