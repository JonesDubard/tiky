"use client"

import React, { useState, useEffect } from "react"
import {
  Search, Download, Filter, RefreshCw,
  Ticket, Calendar, Mail, CheckCircle,
  XCircle, Clock, Eye, ScanLine, X,
  ChevronDown, ChevronUp
} from "lucide-react"
import Link from "next/link"

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
    user: { id: string; name: string | null; email: string } | null
  } | null
}

const statusColors: Record<string, string> = {
  RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  USED: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusIcons: Record<string, any> = {
  RESERVED: Clock,
  PAID: CheckCircle,
  USED: CheckCircle,
  CANCELLED: XCircle,
  EXPIRED: XCircle,
}

export default function TicketsClient() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null)

  useEffect(() => { fetchTickets() }, [])

  const showToast = (message: string, type: "success" | "error" | "warn") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/admin/tickets")
      const data = await res.json()
      setTickets(data)
    } catch {
      showToast("Failed to load tickets", "error")
    } finally {
      setLoading(false)
    }
  }

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
        setTickets(t => t.map(tk =>
          tk.id === ticketId
            ? { ...tk, status: "USED", validatedAt: new Date().toISOString() }
            : tk
        ))
        showToast("Ticket validated successfully", "success")
      } else if (data.alreadyUsed) {
        showToast("Ticket was already used", "warn")
      } else {
        showToast(data.error || "Validation failed", "error")
      }
    } catch {
      showToast("Network error", "error")
    } finally {
      setValidatingId(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      const csvContent = [
        ["Ticket ID", "Event", "Customer", "Email", "Status", "Purchase Date", "Price"],
        ...data.map((t: any) => [
          t["Ticket ID"], t["Event"], t["Customer"],
          t["Email"], t["Status"], t["Purchase Date"], t["Price"],
        ]),
      ].map(row => row.join(",")).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
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

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.order?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketType.event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || t.status === selectedStatus
    return matchesSearch && matchesStatus
  })

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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200"
          : toast.type === "warn" ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
          : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 text-green-600" />
          : toast.type === "warn" ? <Clock className="w-4 h-4 text-yellow-600" />
          : <XCircle className="w-4 h-4 text-red-600" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tickets.length} total tickets</p>
        </div>
        <Link
          href="/admin/tickets/validate"
          className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-all"
        >
          <ScanLine className="w-4 h-4" />
          Validate Tickets
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {["PAID", "USED", "RESERVED", "CANCELLED", "EXPIRED"].map(status => {
          const count = tickets.filter(t => t.status === status).length
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(selectedStatus === status ? "all" : status)}
              className={`rounded-xl border p-3 text-left transition-all ${
                selectedStatus === status
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-xs text-gray-500">{status}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{count}</p>
            </button>
          )
        })}
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets, customers, events..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {["RESERVED", "PAID", "USED", "CANCELLED", "EXPIRED"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tickets table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {["Ticket", "Event", "Customer", "Status", "Date", "Price", "Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${h === "Actions" ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map(ticket => {
                const StatusIcon = statusIcons[ticket.status] || Ticket
                const isExpanded = expandedTicket === ticket.id

                return (
                  <React.Fragment key={ticket.id}>
                    <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? "bg-orange-50" : ""}`}>
                      {/* Ticket ID */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <span className="font-mono text-xs text-gray-700">{ticket.id.slice(0, 10)}...</span>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                          {ticket.ticketType.event.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(ticket.ticketType.event.date).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {ticket.order?.user?.name || ticket.guestName || "Guest"}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {ticket.order?.user?.email || ticket.guestEmail || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[ticket.status] || "bg-gray-100 text-gray-700"}`}>
                          <StatusIcon className="w-3 h-3" />
                          {ticket.status}
                        </span>
                        {ticket.validatedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(ticket.validatedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${ticket.ticketType.price.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Validate button — only for PAID tickets */}
                          {ticket.status === "PAID" && (
                            <button
                              onClick={() => handleValidate(ticket.id, ticket.qrCode)}
                              disabled={validatingId === ticket.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-all disabled:opacity-50"
                              title="Mark as used"
                            >
                              {validatingId === ticket.id
                                ? <RefreshCw className="w-3 h-3 animate-spin" />
                                : <ScanLine className="w-3 h-3" />}
                              Validate
                            </button>
                          )}

                          {/* Expand details */}
                          <button
                            onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${ticket.id}-detail`} className="bg-orange-50">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* QR Code */}
                            <div className="flex flex-col items-center bg-white rounded-xl p-4 border border-orange-100">
                              {ticket.qrImage ? (
                                <img src={ticket.qrImage} alt="QR" className="w-32 h-32" />
                              ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center">
                                  <p className="text-xs text-gray-400">No QR</p>
                                </div>
                              )}
                              <p className="text-xs font-mono text-gray-400 mt-2 break-all text-center">
                                {ticket.qrCode.slice(0, 20)}...
                              </p>
                            </div>

                            {/* Ticket details */}
                            <div className="bg-white rounded-xl p-4 border border-orange-100 space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ticket Details</p>
                              <DetailRow label="Full ID" value={ticket.id} mono />
                              <DetailRow label="Type" value={ticket.ticketType.name} />
                              <DetailRow label="Price" value={`$${ticket.ticketType.price.toFixed(2)}`} />
                              <DetailRow label="Status" value={ticket.status} />
                              {ticket.validatedAt && (
                                <DetailRow label="Validated" value={new Date(ticket.validatedAt).toLocaleString()} />
                              )}
                            </div>

                            {/* Order/Customer details */}
                            <div className="bg-white rounded-xl p-4 border border-orange-100 space-y-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order & Customer</p>
                              {ticket.order && (
                                <DetailRow label="Order ID" value={ticket.order.id.slice(0, 16) + "..."} mono />
                              )}
                              <DetailRow label="Customer" value={ticket.order?.user?.name || ticket.guestName || "Guest"} />
                              <DetailRow label="Email" value={ticket.order?.user?.email || ticket.guestEmail || "—"} />
                              {ticket.phoneNumber && (
                                <DetailRow label="Phone" value={ticket.phoneNumber} />
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

          {filteredTickets.length === 0 && (
            <div className="text-center py-16">
              <Ticket className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No tickets found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-xs text-gray-800 text-right truncate ${mono ? "font-mono" : "font-medium"}`}>
        {value}
      </span>
    </div>
  )
}