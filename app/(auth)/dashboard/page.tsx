"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type TicketInstance = {
  id: string
  status: string
  qrImage: string | null
  createdAt: string
  ticketType: {
    name: string
    price: number
    quantity: number
    soldCount: number
    event: {
      id: string
      title: string
      date: string
      location: string
      imageUrl: string | null
    }
  }
}

type Order = {
  id: string
  totalPrice: number
  status: string
  createdAt: string
  tickets: TicketInstance[]
  payments: {
    paymentMethod: string
    status: string
    amount: number
  }[]
}

const METHOD_LABELS: Record<string, string> = {
  card: "Credit Card",
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  USED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-100 text-red-600",
  RESERVED: "bg-yellow-100 text-yellow-700",
  EXPIRED: "bg-red-100 text-red-400",
}

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      fetchOrders()
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/user/orders")
      if (!res.ok) throw new Error("Failed to load your orders")
      const data = await res.json()
      setOrders(data)
      if (data.length === 1) setExpandedOrder(data[0].id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 text-sm">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchOrders} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm">Try again</button>
        </div>
      </div>
    )
  }

  const allTickets = orders.flatMap(o => o.tickets)
  const totalSpent = orders.filter(o => o.status === "COMPLETED").reduce((s, o) => s + o.totalPrice, 0)
  const activeTickets = allTickets.filter(t => t.status === "PAID").length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">{session?.user?.name || session?.user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-orange-500">{allTickets.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Tickets</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-green-500">{activeTickets}</p>
            <p className="text-xs text-gray-400 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-700">${totalSpent.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">Spent (USD)</p>
          </div>
        </div>

        {/* Empty state */}
        {orders.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">🎟️</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No tickets yet</h2>
            <p className="text-gray-500 text-sm mb-6">Browse events and grab your first ticket!</p>
            <a href="/events" className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all">
              Browse Events
            </a>
          </div>
        )}

        {/* Orders list */}
        <div className="space-y-4">
          {orders.map(order => {
            const isExpanded = expandedOrder === order.id
            const payment = order.payments[0]
            const event = order.tickets[0]?.ticketType?.event

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="w-full text-left p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{event?.title || "Unknown Event"}</h3>
                      {event && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          {" · "}{event.location}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        <span className="text-xs text-gray-500">🎟 {order.tickets.length} ticket{order.tickets.length !== 1 ? "s" : ""}</span>
                        <span className="text-xs font-bold text-gray-800">${order.totalPrice.toFixed(2)} USD</span>
                        {payment && <span className="text-xs text-gray-400">via {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${order.status === "COMPLETED" ? "bg-green-100 text-green-700" : order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                        {order.status}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {order.tickets.map((ticket, idx) => {
                      const tt = ticket.ticketType
                      const remaining = Math.max(0, tt.quantity - tt.soldCount)
                      const remainingPct = tt.quantity > 0 ? Math.min(100, (remaining / tt.quantity) * 100) : 0

                      return (
                        <div key={ticket.id} className={`p-5 ${idx < order.tickets.length - 1 ? "border-b border-gray-50" : ""}`}>
                          <div className="flex items-start gap-4">
                            {/* QR */}
                            <div className="flex-shrink-0">
                              {ticket.qrImage ? (
                                <img src={ticket.qrImage} alt="QR" className="w-16 h-16 rounded-xl border border-gray-200" />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                                  <span className="text-xs text-gray-400">No QR</span>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900">{tt.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 font-mono mb-2 truncate">{ticket.id}</p>
                              <p className="text-sm font-bold text-gray-900">
                                ${tt.price.toFixed(2)} <span className="text-xs font-normal text-gray-400">USD</span>
                              </p>

                              {/* Availability */}
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Event availability</span>
                                  <span className={remaining <= 5 ? "text-red-500 font-semibold" : ""}>{remaining} of {tt.quantity} left</span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${remainingPct > 50 ? "bg-green-400" : remainingPct > 20 ? "bg-yellow-400" : "bg-red-400"}`}
                                    style={{ width: `${Math.max(2, remainingPct)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Download */}
                            <a
                              href={`/api/tickets/pdf/${ticket.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View & Print Ticket"
                              className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-2 rounded-xl hover:bg-gray-700 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Print
                            </a>
                          </div>
                        </div>
                      )
                    })}

                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                      <span className="font-mono truncate mr-4">#{order.id}</span>
                      <span>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {orders.length > 0 && (
          <div className="mt-8 text-center">
            <a href="/events" className="text-sm text-orange-500 hover:underline font-medium">Browse more events →</a>
          </div>
        )}
      </div>
    </div>
  )
}