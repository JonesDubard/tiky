"use client"

// app/admin/tickets/TicketsClients.tsx
//
// CHANGES from previous version:
// 1. Accepts initialStats prop — stat counts stay in sync with table data
// 2. Clicking a stat card filters the table (stats are interactive)
// 3. RESERVED status shown prominently (manual payment flow)
// 4. Revenue derived from live ticket data (stays accurate as table filters)
// 5. Removed Validate button from here — moved to page header
// 6. Export, search, expand detail all preserved
// 7. Cleaner visual hierarchy in expanded rows

import React, { useState, useEffect, useCallback } from "react"
import {
  Search, Download, Filter, RefreshCw,
  Ticket, Calendar, Mail, CheckCircle,
  XCircle, Clock, Eye, ScanLine,
  ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TicketRow {
  id: string
  status: string
  qrCode: string
  qrImage: string | null
  guestName: string | null
  guestEmail: string | null
  phoneNumber: string | null
  validatedAt: string | null
  createdAt: string
  ticketType: {
    id: string
    name: string
    price: number
    event: { id: string; title: string; date: string }
  }
  order: {
    id: string
    status: string
    totalPrice: number
    referenceCode: string | null
    user: { id: string; name: string | null; email: string } | null
  } | null
}

interface Stats {
  total: number
  reserved: number
  paid: number
  used: number
  cancelled: number
  revenue: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: React.ElementType; label: string }
> = {
  RESERVED: {
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: AlertCircle,
    label: "Reserved",
  },
  PAID: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    label: "Confirmed",
  },
  USED: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
    label: "Used",
  },
  CANCELLED: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    label: "Cancelled",
  },
  EXPIRED: {
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: XCircle,
    label: "Expired",
  },
}

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "RESERVED", label: "Reserved" },
  { key: "PAID", label: "Confirmed" },
  { key: "USED", label: "Used" },
  { key: "CANCELLED", label: "Cancelled" },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function TicketsClient({
  initialStats,
}: {
  initialStats: Stats
}) {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error" | "warn"
  } | null>(null)

  // Live stats derived from fetched ticket data — stay in sync with filters
  const [liveStats, setLiveStats] = useState<Stats>(initialStats)

  const showToast = (message: string, type: "success" | "error" | "warn") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Data fetching ───────────────────────────────────────────────────────

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/tickets")
      if (!res.ok) throw new Error("Failed to fetch")
      const data: TicketRow[] = await res.json()
      setTickets(data)

      // Recalculate stats from live data
      const byStatus: Record<string, number> = {}
      let revenue = 0
      for (const t of data) {
        byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
        if (t.status === "PAID" || t.status === "USED") {
          revenue += t.ticketType.price
        }
      }
      setLiveStats({
        total: data.length,
        reserved: byStatus["RESERVED"] ?? 0,
        paid: byStatus["PAID"] ?? 0,
        used: byStatus["USED"] ?? 0,
        cancelled: byStatus["CANCELLED"] ?? 0,
        revenue,
      })
    } catch {
      showToast("Failed to load tickets", "error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // ── Validation ──────────────────────────────────────────────────────────

  const handleValidate = async (ticketId: string, qrCode: string) => {
    setValidatingId(ticketId)
    try {
      const res = await fetch("/api/admin/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode }),
      })
      const data = await res.json()

      if (data.valid) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: "USED", validatedAt: new Date().toISOString() }
              : t
          )
        )
        // Update live stat
        setLiveStats((prev) => ({
          ...prev,
          paid: prev.paid - 1,
          used: prev.used + 1,
        }))
        showToast("✓ Ticket validated successfully", "success")
      } else if (data.alreadyUsed) {
        showToast("Ticket was already used", "warn")
      } else {
        showToast(data.error || "Validation failed", "error")
      }
    } catch {
      showToast("Network error — try again", "error")
    } finally {
      setValidatingId(null)
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows = [
        ["Ticket ID", "Event", "Customer", "Email", "Status", "Purchase Date", "Price"],
        ...filteredTickets.map((t) => [
          t.id,
          t.ticketType.event.title,
          t.order?.user?.name ?? t.guestName ?? "Guest",
          t.order?.user?.email ?? t.guestEmail ?? "—",
          t.status,
          new Date(t.createdAt).toLocaleDateString(),
          `$${t.ticketType.price.toFixed(2)}`,
        ]),
      ]
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast("Export failed", "error")
    } finally {
      setExporting(false)
    }
  }

  // ── Filtering ───────────────────────────────────────────────────────────

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketType.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.order?.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesStatus = activeFilter === "all" || t.status === activeFilter
    return matchesSearch && matchesStatus
  })

  // Revenue of currently visible tickets
  const visibleRevenue = filteredTickets
    .filter((t) => t.status === "PAID" || t.status === "USED")
    .reduce((sum, t) => sum + t.ticketType.price, 0)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : toast.type === "warn"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : toast.type === "warn" ? (
            <AlertCircle className="w-4 h-4 text-amber-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          {toast.message}
        </div>
      )}

      {/* ── Interactive stat tabs ─────────────────────────────────────── */}
      {/* Clicking a tab filters the table — these replace the page-level
          decorative stat cards that previously did nothing */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Filter by status
          </p>
          <span className="text-xs text-gray-400">
            {filteredTickets.length} shown · Revenue:{" "}
            <span className="font-semibold text-gray-700">
              ${visibleRevenue.toFixed(2)}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? liveStats.total
                : tab.key === "RESERVED"
                ? liveStats.reserved
                : tab.key === "PAID"
                ? liveStats.paid
                : tab.key === "USED"
                ? liveStats.used
                : liveStats.cancelled

            const isActive = activeFilter === tab.key
            const isReserved = tab.key === "RESERVED"

            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isReserved && count > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {count}
                  {isReserved && count > 0 && !isActive && " ●"}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search + actions bar ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, event, or reference code..."
            className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || filteredTickets.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading tickets...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {[
                    "Ticket",
                    "Event & Date",
                    "Customer",
                    "Status",
                    "Ref Code",
                    "Price",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        h === "Actions" ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => {
                  const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG["EXPIRED"]
                  const StatusIcon = cfg.icon
                  const isExpanded = expandedTicket === ticket.id

                  return (
                    <React.Fragment key={ticket.id}>
                      <tr
                        className={`hover:bg-gray-50 transition-colors ${
                          isExpanded ? "bg-orange-50/50" : ""
                        } ${ticket.status === "RESERVED" ? "border-l-2 border-l-amber-400" : ""}`}
                      >
                        {/* Ticket ID */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Ticket className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                            <span className="font-mono text-xs text-gray-600">
                              {ticket.id.slice(0, 12)}…
                            </span>
                          </div>
                        </td>

                        {/* Event */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                            {ticket.ticketType.event.title}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(ticket.ticketType.event.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900 font-medium">
                            {ticket.order?.user?.name ?? ticket.guestName ?? "Guest"}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {ticket.order?.user?.email ?? ticket.guestEmail ?? "—"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          {ticket.validatedAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(ticket.validatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </td>

                        {/* Reference code */}
                        <td className="px-4 py-3">
                          {ticket.order?.referenceCode ? (
                            <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {ticket.order.referenceCode}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">
                            ${ticket.ticketType.price.toFixed(2)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {ticket.status === "PAID" && (
                              <button
                                onClick={() =>
                                  handleValidate(ticket.id, ticket.qrCode)
                                }
                                disabled={validatingId === ticket.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-all disabled:opacity-50"
                              >
                                {validatingId === ticket.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ScanLine className="w-3 h-3" />
                                )}
                                Validate
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setExpandedTicket(
                                  isExpanded ? null : ticket.id
                                )
                              }
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded detail row ─────────────────────── */}
                      {isExpanded && (
                        <tr className="bg-orange-50/40">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {/* QR Code */}
                              <div className="bg-white rounded-xl border border-orange-100 p-4 flex flex-col items-center gap-3">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider self-start">
                                  QR Code
                                </p>
                                {ticket.qrImage ? (
                                  <img
                                    src={ticket.qrImage}
                                    alt="QR"
                                    className="w-32 h-32 rounded-lg"
                                  />
                                ) : (
                                  <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <p className="text-xs text-gray-400 text-center px-2">
                                      {ticket.status === "RESERVED"
                                        ? "Generated after payment confirmed"
                                        : "Not available"}
                                    </p>
                                  </div>
                                )}
                                <p className="text-xs font-mono text-gray-400 break-all text-center">
                                  {ticket.qrCode.slice(0, 24)}…
                                </p>
                              </div>

                              {/* Ticket details */}
                              <div className="bg-white rounded-xl border border-orange-100 p-4 space-y-2.5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Ticket Details
                                </p>
                                <DetailRow label="Full ID" value={ticket.id} mono />
                                <DetailRow
                                  label="Type"
                                  value={ticket.ticketType.name}
                                />
                                <DetailRow
                                  label="Price"
                                  value={`$${ticket.ticketType.price.toFixed(2)}`}
                                />
                                <DetailRow label="Status" value={cfg.label} />
                                <DetailRow
                                  label="Created"
                                  value={new Date(ticket.createdAt).toLocaleString()}
                                />
                                {ticket.validatedAt && (
                                  <DetailRow
                                    label="Validated"
                                    value={new Date(
                                      ticket.validatedAt
                                    ).toLocaleString()}
                                  />
                                )}
                              </div>

                              {/* Order & customer */}
                              <div className="bg-white rounded-xl border border-orange-100 p-4 space-y-2.5">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                  Order & Customer
                                </p>
                                {ticket.order && (
                                  <>
                                    <DetailRow
                                      label="Order ID"
                                      value={`${ticket.order.id.slice(0, 16)}…`}
                                      mono
                                    />
                                    {ticket.order.referenceCode && (
                                      <DetailRow
                                        label="Ref Code"
                                        value={ticket.order.referenceCode}
                                        mono
                                      />
                                    )}
                                  </>
                                )}
                                <DetailRow
                                  label="Customer"
                                  value={
                                    ticket.order?.user?.name ??
                                    ticket.guestName ??
                                    "Guest"
                                  }
                                />
                                <DetailRow
                                  label="Email"
                                  value={
                                    ticket.order?.user?.email ??
                                    ticket.guestEmail ??
                                    "—"
                                  }
                                />
                                {ticket.phoneNumber && (
                                  <DetailRow
                                    label="Phone"
                                    value={ticket.phoneNumber}
                                  />
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>

            {filteredTickets.length === 0 && !loading && (
              <div className="text-center py-16">
                <Ticket className="mx-auto h-10 w-10 text-gray-200" />
                <p className="mt-3 text-sm font-medium text-gray-500">
                  No tickets found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchTerm
                    ? "Try a different search term"
                    : "No tickets match this filter"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filteredTickets.length} ticket
            {filteredTickets.length !== 1 ? "s" : ""} shown
          </p>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium"
            >
              Clear filter ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-3 items-start">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span
        className={`text-xs text-right text-gray-800 ${
          mono ? "font-mono break-all" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  )
}