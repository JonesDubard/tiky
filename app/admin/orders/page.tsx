"use client"

// app/admin/orders/page.tsx
//
// UPDATED: Added approve/reject workflow for manual payment orders.
// Manual payment orders (mtn_momo, orange_money, bank_transfer) show:
// - Proof image viewer
// - Approve button → issues tickets
// - Reject button with reason → restores inventory

import { useState, useEffect, useCallback } from "react"
import {
  Search, Filter, RefreshCw, ShoppingBag, Calendar,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Ticket, CreditCard, Eye, ExternalLink, MessageCircle,
} from "lucide-react"

type TicketInstance = {
  id: string
  status: string
  ticketType: {
    name: string
    price: number
    event: { id: string; title: string; date: string }
  }
}

type Order = {
  id: string
  totalPrice: number
  status: string
  ticketGenerated: boolean
  createdAt: string
  referenceCode: string | null
  proofUrl: string | null
  proofNote: string | null
  paymentMethod: string | null
  user: { id: string; name: string | null; email: string } | null
  tickets: TicketInstance[]
  payments: {
    id: string
    amount: number
    currency: string
    status: string
    paymentMethod: string | null
    processedAt: string | null
  }[]
}

// Which order statuses are manual payment orders needing review
const MANUAL_REVIEW_STATUSES = ["AWAITING_APPROVAL", "PENDING_CONFIRMATION"]

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING_CONFIRMATION: "bg-blue-100 text-blue-800 border-blue-200",
  AWAITING_APPROVAL: "bg-purple-100 text-purple-800 border-purple-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
}

const METHOD_LABELS: Record<string, string> = {
  card: "Card",
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
  bank_transfer: "Bank Transfer",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Action state
  const [actionLoading, setActionLoading] = useState<Record<string, "approving" | "rejecting" | null>>({})
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [proofModal, setProofModal] = useState<string | null>(null) // URL of proof image

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (searchTerm) params.append("search", searchTerm)
      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      showToast("Failed to load orders", "error")
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, searchTerm])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Approve ───────────────────────────────────────────────────────────────

  const handleApprove = async (orderId: string) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: "approving" }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Approval failed")
      showToast(`✅ Approved — ${data.ticketCount} ticket(s) issued`, "success")
      // Update order in list
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "COMPLETED", ticketGenerated: true } : o))
      )
      setExpandedOrder(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Approval failed", "error")
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: null }))
    }
  }

  // ── Reject ────────────────────────────────────────────────────────────────

  const handleReject = async (orderId: string) => {
    const reason = rejectionReason[orderId]?.trim() || "Payment could not be verified"
    setActionLoading((prev) => ({ ...prev, [orderId]: "rejecting" }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Rejection failed")
      showToast("❌ Order rejected. Inventory restored.", "success")
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "REJECTED" } : o))
      )
      setShowRejectInput((prev) => ({ ...prev, [orderId]: false }))
      setExpandedOrder(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Rejection failed", "error")
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: null }))
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tickets.some((t) => t.ticketType.event.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const awaitingApproval = orders.filter((o) => MANUAL_REVIEW_STATUSES.includes(o.status)).length

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0)

  const completedCount = orders.filter((o) => o.status === "COMPLETED").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Proof image modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setProofModal(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProofModal(null)}
              className="absolute -top-10 right-0 text-white text-sm flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" /> Close
            </button>
            <img src={proofModal} alt="Proof of payment" className="w-full rounded-2xl shadow-2xl" />
            <a
              href={proofModal}
              target="_blank"
              rel="noreferrer"
              className="block text-center text-xs text-white/60 mt-2 hover:text-white"
            >
              Open full size ↗
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">
            {awaitingApproval > 0 && (
              <span className="inline-flex items-center gap-1 text-purple-600 font-medium">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                {awaitingApproval} awaiting approval ·{" "}
              </span>
            )}
            {orders.length} total orders
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Needs Review</p>
          <p className={`text-2xl font-bold ${awaitingApproval > 0 ? "text-purple-600" : "text-gray-400"}`}>
            {awaitingApproval}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Revenue</p>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter row */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-gray-100">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ref code, customer, event..."
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="p-4 flex gap-3 flex-wrap border-t border-gray-100">
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="AWAITING_APPROVAL">Awaiting Approval</option>
              <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrder === order.id
          const isManualPending = MANUAL_REVIEW_STATUSES.includes(order.status)
          const eventTitle = order.tickets[0]?.ticketType?.event?.title ?? "Unknown event"
          const payment = order.payments[0]
          const isApproving = actionLoading[order.id] === "approving"
          const isRejecting = actionLoading[order.id] === "rejecting"
          const showingRejectInput = showRejectInput[order.id] ?? false
          const methodLabel =
            METHOD_LABELS[order.paymentMethod ?? ""] ??
            METHOD_LABELS[payment?.paymentMethod ?? ""] ??
            "—"

          return (
            <div
              key={order.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                isManualPending ? "border-purple-200 shadow-sm" : "border-gray-200"
              }`}
            >
              {/* ── Order row ─────────────────────────────────────────── */}
              <div
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                  isExpanded ? "bg-gray-50" : ""
                }`}
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Status indicator dot */}
                  <div className="flex-shrink-0">
                    {isManualPending ? (
                      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-orange-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {order.referenceCode && (
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {order.referenceCode}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      {order.proofUrl && (
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                          <Eye className="w-3 h-3" /> Proof submitted
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{eventTitle}</p>
                    <p className="text-xs text-gray-400">
                      {order.user?.name ?? order.user?.email ?? "Guest"} · {methodLabel} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-gray-900">${order.totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{order.tickets.length} ticket{order.tickets.length !== 1 ? "s" : ""}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* ── Expanded detail ───────────────────────────────────── */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                  {/* Proof of payment */}
                  {(order.proofUrl || order.proofNote) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Proof of Payment
                      </p>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                        {order.proofUrl ? (
                          <>
                            <div
                              className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 cursor-pointer flex-shrink-0 border border-gray-200"
                              onClick={() => setProofModal(order.proofUrl!)}
                            >
                              <img
                                src={order.proofUrl}
                                alt="Proof"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 font-medium">Screenshot uploaded</p>
                              {order.proofNote && !order.proofNote.startsWith("REJECTED:") && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  TX ID: <span className="font-mono">{order.proofNote}</span>
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setProofModal(order.proofUrl!)}
                              className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </>
                        ) : (
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">Transaction ID submitted</p>
                            <p className="text-xs font-mono text-gray-500 mt-0.5">{order.proofNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Approve / Reject actions for manual orders */}
                  {isManualPending && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Actions
                      </p>

                      {!showingRejectInput ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(order.id)}
                            disabled={isApproving || isRejecting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                          >
                            {isApproving ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            {isApproving ? "Approving..." : "Approve & Issue Tickets"}
                          </button>

                          <button
                            onClick={() => setShowRejectInput((prev) => ({ ...prev, [order.id]: true }))}
                            disabled={isApproving || isRejecting}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium border border-red-200 rounded-xl transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Rejection reason (optional)"
                            value={rejectionReason[order.id] ?? ""}
                            onChange={(e) =>
                              setRejectionReason((prev) => ({ ...prev, [order.id]: e.target.value }))
                            }
                            className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(order.id)}
                              disabled={isRejecting}
                              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isRejecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                            </button>
                            <button
                              onClick={() => setShowRejectInput((prev) => ({ ...prev, [order.id]: false }))}
                              className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* WhatsApp notification after approve (shown post-approval) */}
                      {order.status === "COMPLETED" && order.user && (
                        <a
                          href={`https://wa.me/${order.user.email}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Notify customer via WhatsApp
                        </a>
                      )}
                    </div>
                  )}

                  {/* Customer info */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
                    <p className="text-sm font-medium text-gray-900">{order.user?.name ?? "Guest"}</p>
                    <p className="text-sm text-gray-500">{order.user?.email ?? "—"}</p>
                  </div>

                  {/* Tickets */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Tickets ({order.tickets.length})
                    </p>
                    <div className="space-y-2">
                      {order.tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-orange-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{ticket.ticketType.name}</p>
                              <p className="text-xs font-mono text-gray-400">{ticket.id.slice(0, 14)}...</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {ticket.status}
                            </span>
                            <span className="text-sm font-bold text-gray-700">
                              ${ticket.ticketType.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment record */}
                  {payment && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment</p>
                      <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {METHOD_LABELS[payment.paymentMethod ?? ""] ?? payment.paymentMethod ?? "—"}
                            </p>
                            {payment.processedAt && (
                              <p className="text-xs text-gray-400">
                                {new Date(payment.processedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ${payment.amount.toFixed(2)} {payment.currency}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-300 font-mono">Order: {order.id}</p>
                </div>
              )}
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-200" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  )
}