// app/admin/orders/page.tsx
"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  RefreshCw,
  ShoppingBag,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Ticket,
  CreditCard,
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

const statusColors: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusIcons: Record<string, any> = {
  COMPLETED: CheckCircle,
  PENDING: Clock,
  FAILED: XCircle,
  CANCELLED: XCircle,
}

const methodLabel: Record<string, string> = {
  card: "Card",
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (searchTerm) params.append("search", searchTerm)
      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tickets.some((t) =>
        t.ticketType.event.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    const matchesStatus =
      selectedStatus === "all" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Summary stats
  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0)
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">All ticket purchases and payment records</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders}</p>
          <p className="text-xs text-gray-400">{pendingOrders} pending</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-gray-100">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or event..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="p-4 flex gap-3 flex-wrap">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
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
          const StatusIcon = statusIcons[order.status] || Clock
          const isExpanded = expandedOrder === order.id
          const eventTitle = order.tickets[0]?.ticketType?.event?.title || "Unknown event"
          const payment = order.payments[0]

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Order row */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-xs text-gray-500">
                        {order.id.slice(0, 12)}...
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                          statusColors[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{eventTitle}</p>
                    <p className="text-xs text-gray-500">
                      {order.user?.name || order.user?.email || "Guest"} •{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-gray-900">${order.totalPrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {order.tickets.length} ticket{order.tickets.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                  {/* Customer */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Customer
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {order.user?.name || "Guest"}
                    </p>
                    <p className="text-sm text-gray-500">{order.user?.email || "—"}</p>
                  </div>

                  {/* Tickets */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
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
                              <p className="text-sm font-medium text-gray-900">
                                {ticket.ticketType.name}
                              </p>
                              <p className="text-xs font-mono text-gray-400">
                                {ticket.id.slice(0, 16)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                statusColors[ticket.status] || "bg-gray-100 text-gray-800"
                              }`}
                            >
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

                  {/* Payment */}
                  {payment && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Payment
                      </p>
                      <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {methodLabel[payment.paymentMethod || ""] || payment.paymentMethod || "Unknown"}
                            </p>
                            {payment.processedAt && (
                              <p className="text-xs text-gray-500">
                                {new Date(payment.processedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ${payment.amount.toFixed(2)} {payment.currency}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              statusColors[payment.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full order ID */}
                  <p className="text-xs text-gray-400 font-mono">Order ID: {order.id}</p>
                </div>
              )}
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredOrders.length} of {orders.length} orders
      </div>
    </div>
  )
}