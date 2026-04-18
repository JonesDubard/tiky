"use client"

// app/admin/orders/page.tsx

import { useState, useEffect, useCallback } from "react"
import {
  Search, Filter, RefreshCw, ShoppingBag,
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Ticket, CreditCard, Eye, MessageCircle, Undo2, Trash2, AlertTriangle,
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

const MANUAL_REVIEW_STATUSES = ["AWAITING_APPROVAL", "PENDING_CONFIRMATION"]
const UNDOABLE_STATUSES      = ["COMPLETED"]

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:            "bg-green-100 text-green-800 border-green-200",
  PENDING:              "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING_CONFIRMATION: "bg-blue-100 text-blue-800 border-blue-200",
  AWAITING_APPROVAL:    "bg-purple-100 text-purple-800 border-purple-200",
  REJECTED:             "bg-red-100 text-red-800 border-red-200",
  FAILED:               "bg-red-100 text-red-800 border-red-200",
  CANCELLED:            "bg-gray-100 text-gray-600 border-gray-200",
}

const METHOD_LABELS: Record<string, string> = {
  card:          "Card",
  mtn_momo:      "MTN MoMo",
  orange_money:  "Orange Money",
  bank_transfer: "Bank Transfer",
}

export default function OrdersPage() {
  const [orders, setOrders]               = useState<Order[]>([])
  const [loading, setLoading]             = useState(true)
  const [searchTerm, setSearchTerm]       = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showFilters, setShowFilters]     = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Action state
  const [actionLoading, setActionLoading] = useState<Record<string, "approving" | "rejecting" | "deleting" | null>>({})
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({})
  const [toast, setToast]       = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [proofModal, setProofModal] = useState<string | null>(null)

  // Clear-all modal state
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [clearAllLoading, setClearAllLoading]     = useState(false)
  const [clearAllConfirmText, setClearAllConfirmText] = useState("")

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
      const res  = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      showToast("Failed to load orders", "error")
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, searchTerm])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = async (orderId: string) => {
    setActionLoading(prev => ({ ...prev, [orderId]: "approving" }))
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/approve`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Approval failed")
      showToast(`✅ Approved — ${data.ticketCount} ticket(s) issued`, "success")
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: "COMPLETED", ticketGenerated: true } : o)
      )
      setExpandedOrder(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Approval failed", "error")
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }))
    }
  }

  // ── Reject / Undo ──────────────────────────────────────────────────────────
  const handleReject = async (orderId: string, isUndo = false) => {
    const reason = rejectionReason[orderId]?.trim() ||
      (isUndo ? "Approval reversed by admin" : "Payment could not be verified")
    setActionLoading(prev => ({ ...prev, [orderId]: "rejecting" }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Rejection failed")
      showToast(
        isUndo
          ? `↩️ Approval undone. ${data.cancelledTickets} ticket(s) cancelled.`
          : `❌ Order rejected. ${data.cancelledTickets} ticket(s) cancelled.`,
        "success"
      )
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: "REJECTED", ticketGenerated: false } : o)
      )
      setShowRejectInput(prev => ({ ...prev, [orderId]: false }))
      setExpandedOrder(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error")
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }))
    }
  }

  // ── Delete single order ────────────────────────────────────────────────────
  const handleDeleteOne = async (orderId: string) => {
    setActionLoading(prev => ({ ...prev, [orderId]: "deleting" }))
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      showToast(`🗑️ ${data.message}`, "success")
      setOrders(prev => prev.filter(o => o.id !== orderId))
      setExpandedOrder(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error")
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }))
    }
  }

  // ── Clear all orders ───────────────────────────────────────────────────────
  const handleClearAll = async () => {
    if (clearAllConfirmText !== "DELETE ALL") return
    setClearAllLoading(true)
    try {
      const res  = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_ALL" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed")
      showToast(`🗑️ ${data.message}`, "success")
      setOrders([])
      setShowClearAllModal(false)
      setClearAllConfirmText("")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to clear orders", "error")
    } finally {
      setClearAllLoading(false)
    }
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.referenceCode?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tickets.some(t =>
        t.ticketType.event.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const awaitingApproval = orders.filter(o => MANUAL_REVIEW_STATUSES.includes(o.status)).length
  const totalRevenue = orders
    .filter(o => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  )

  return (
    <div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === "success"
            ? "bg-green-50 text-green-800 border-green-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {toast.message}
        </div>
      )}

      {/* ── Proof image modal ── */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setProofModal(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setProofModal(null)}
              className="absolute -top-10 right-0 text-white text-sm flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" /> Close
            </button>
            <img src={proofModal} alt="Proof of payment" className="w-full rounded-2xl shadow-2xl" />
            <a href={proofModal} target="_blank" rel="noreferrer"
              className="block text-center text-xs text-white/60 mt-2 hover:text-white">
              Open full size ↗
            </a>
          </div>
        </div>
      )}

      {/* ── Clear All confirmation modal ── */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Clear all orders</h2>
                <p className="text-xs text-gray-400">This cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              This will permanently delete <span className="font-semibold text-gray-900">
              all {orders.length} order{orders.length !== 1 ? "s" : ""}</span> and every related
              ticket, payment, and reservation — including analytics data.
            </p>

            <p className="text-xs text-gray-500 mb-2">
              Type <span className="font-mono font-bold text-red-600">DELETE ALL</span> to confirm:
            </p>
            <input
              type="text"
              value={clearAllConfirmText}
              onChange={e => setClearAllConfirmText(e.target.value)}
              placeholder="DELETE ALL"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                disabled={clearAllConfirmText !== "DELETE ALL" || clearAllLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-all"
              >
                {clearAllLoading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Deleting...</>
                  : <><Trash2 className="w-4 h-4" /> Delete everything</>}
              </button>
              <button
                onClick={() => { setShowClearAllModal(false); setClearAllConfirmText("") }}
                disabled={clearAllLoading}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
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
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-600 font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
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

      {/* ── Filter row ── */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-gray-100">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ref code, customer, event..."
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
              onChange={e => setSelectedStatus(e.target.value)}
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

      {/* ── Orders list ── */}
      <div className="space-y-3">
        {filteredOrders.map(order => {
          const isExpanded         = expandedOrder === order.id
          const isManualPending    = MANUAL_REVIEW_STATUSES.includes(order.status)
          const isUndoable         = UNDOABLE_STATUSES.includes(order.status)
          const eventTitle         = order.tickets[0]?.ticketType?.event?.title ?? "Unknown event"
          const payment            = order.payments[0]
          const isApproving        = actionLoading[order.id] === "approving"
          const isRejecting        = actionLoading[order.id] === "rejecting"
          const isDeleting         = actionLoading[order.id] === "deleting"
          const showingRejectInput = showRejectInput[order.id] ?? false
          const methodLabel        =
            METHOD_LABELS[order.paymentMethod ?? ""] ??
            METHOD_LABELS[payment?.paymentMethod ?? ""] ?? "—"

          const rejectionNoteRaw = order.proofNote ?? ""
          const rejectionDisplay = rejectionNoteRaw.startsWith("REJECTED:")
            ? rejectionNoteRaw.replace(/^REJECTED:\s*/, "")
            : null

          return (
            <div
              key={order.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                isManualPending
                  ? "border-purple-200 shadow-sm"
                  : isUndoable ? "border-green-200" : "border-gray-200"
              }`}
            >
              {/* ── Order row ── */}
              <div
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${
                  isExpanded ? "bg-gray-50" : ""
                }`}
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}>
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
                    <p className="text-xs text-gray-400">
                      {order.tickets.length} ticket{order.tickets.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* ── Expanded detail ── */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">

                  {/* Rejection reason banner */}
                  {order.status === "REJECTED" && rejectionDisplay && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-red-700">Rejection reason</p>
                        <p className="text-sm text-red-600 mt-0.5">{rejectionDisplay}</p>
                      </div>
                    </div>
                  )}

                  {/* Proof of payment */}
                  {(order.proofUrl || (order.proofNote && !rejectionDisplay)) && (
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
                              <img src={order.proofUrl} alt="Proof" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 font-medium">Screenshot uploaded</p>
                              {order.proofNote && !rejectionDisplay && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  TX ID: <span className="font-mono">{order.proofNote}</span>
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setProofModal(order.proofUrl!)}
                              className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Eye className="w-4 h-4" /> View
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

                  {/* Approve / Reject actions */}
                  {isManualPending && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Actions</p>
                      {!showingRejectInput ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(order.id)}
                            disabled={isApproving || isRejecting || isDeleting}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                          >
                            {isApproving
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <CheckCircle className="w-4 h-4" />}
                            {isApproving ? "Approving..." : "Approve & Issue Tickets"}
                          </button>
                          <button
                            onClick={() => setShowRejectInput(prev => ({ ...prev, [order.id]: true }))}
                            disabled={isApproving || isRejecting || isDeleting}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium border border-red-200 rounded-xl transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Rejection reason (optional)"
                            value={rejectionReason[order.id] ?? ""}
                            onChange={e =>
                              setRejectionReason(prev => ({ ...prev, [order.id]: e.target.value }))
                            }
                            className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(order.id, false)}
                              disabled={isRejecting}
                              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isRejecting && <RefreshCw className="w-4 h-4 animate-spin" />}
                              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                            </button>
                            <button
                              onClick={() => setShowRejectInput(prev => ({ ...prev, [order.id]: false }))}
                              className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Undo approval panel */}
                  {isUndoable && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        Undo Approval
                      </p>
                      {!showingRejectInput ? (
                        <button
                          onClick={() => setShowRejectInput(prev => ({ ...prev, [order.id]: true }))}
                          disabled={isRejecting || isDeleting}
                          className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium border border-amber-200 rounded-xl transition-all disabled:opacity-50"
                        >
                          <Undo2 className="w-4 h-4" />
                          Reverse this approval
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <Undo2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                              This will cancel all issued tickets and mark the order rejected.
                              Tickets already scanned at the door will be left intact.
                            </p>
                          </div>
                          <input
                            type="text"
                            placeholder="Reason for reversal (optional)"
                            value={rejectionReason[order.id] ?? ""}
                            onChange={e =>
                              setRejectionReason(prev => ({ ...prev, [order.id]: e.target.value }))
                            }
                            className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(order.id, true)}
                              disabled={isRejecting}
                              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isRejecting && <RefreshCw className="w-4 h-4 animate-spin" />}
                              {isRejecting ? "Reversing..." : "Confirm Reversal"}
                            </button>
                            <button
                              onClick={() => setShowRejectInput(prev => ({ ...prev, [order.id]: false }))}
                              className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Delete this order ── */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Danger Zone
                    </p>
                    <button
                      onClick={() => handleDeleteOne(order.id)}
                      disabled={isDeleting || isApproving || isRejecting}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 text-sm font-medium border border-red-200 rounded-xl transition-all disabled:opacity-50"
                    >
                      {isDeleting
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Deleting...</>
                        : <><Trash2 className="w-4 h-4" /> Delete this order</>}
                    </button>
                  </div>

                  {/* Customer */}
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
                      {order.tickets.map(ticket => (
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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                              STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-600"
                            }`}>
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
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-600"
                          }`}>
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