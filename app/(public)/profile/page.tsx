"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Ticket, BarChart, Calendar } from "lucide-react"

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
  USED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-600",
  RESERVED: "bg-yellow-100 text-yellow-700",
  EXPIRED: "bg-red-100 text-red-500",
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      if ((session?.user as any)?.role === "ADMIN") {
        router.push("/admin")
        return
      }
      fetchOrders()
    }
  }, [status])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/user/orders")
      if (!res.ok) throw new Error("Failed to load orders")
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const user = session?.user
  const allTickets = orders.flatMap(o => o.tickets)
  const totalSpent = orders.reduce((sum, o) => sum + (o.status === "COMPLETED" ? o.totalPrice : 0), 0)
  const activeTickets = allTickets.filter(t => t.status === "PAID").length

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900">{user?.name || "User"}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{user?.email}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <Ticket className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900">{allTickets.length}</p>
                <p className="text-xs text-slate-500">Tickets</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <BarChart className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900">{activeTickets}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-900">{orders.length}</p>
                <p className="text-xs text-slate-500">Orders</p>
              </div>
            </div>
          </div>

          {/* Total spent */}
          {totalSpent > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-slate-500">Total spent</span>
              <span className="font-bold text-slate-800">${totalSpent.toFixed(2)} USD</span>
            </div>
          )}
        </div>

        {/* Orders / Tickets */}
        <h2 className="text-lg font-bold text-slate-800 mb-4">My Tickets</h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No tickets yet</h3>
            <p className="text-gray-500 text-sm mb-6">Browse events and grab your first ticket!</p>
            <a
              href="/events"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const isExpanded = expandedOrder === order.id
              const payment = order.payments[0]
              const firstTicket = order.tickets[0]
              const event = firstTicket?.ticketType?.event

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Order header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full text-left"
                  >
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {event?.title || "Unknown Event"}
                        </h3>
                        {event && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(event.date).toLocaleDateString("en-US", {
                              weekday: "short", month: "short", day: "numeric", year: "numeric",
                            })}
                            {" · "}{event.location}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-400">
                            {order.tickets.length} ticket{order.tickets.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs font-semibold text-gray-700">
                            ${order.totalPrice.toFixed(2)} USD
                          </span>
                          {payment && (
                            <span className="text-xs text-gray-400">
                              {METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {order.status}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Expanded tickets */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {order.tickets.map((ticket, idx) => {
                        const tt = ticket.ticketType
                        const remaining = tt.quantity - tt.soldCount
                        const remainingPct = Math.max(0, Math.min(100, (remaining / tt.quantity) * 100))

                        return (
                          <div key={ticket.id} className={`p-5 ${idx < order.tickets.length - 1 ? "border-b border-gray-50" : ""}`}>
                            <div className="flex items-start justify-between gap-4">
                              {/* QR */}
                              <div className="flex-shrink-0">
                                {ticket.qrImage ? (
                                  <img src={ticket.qrImage} alt="QR" className="w-16 h-16 rounded-lg border border-gray-200" />
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">No QR</span>
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-gray-800 text-sm">{tt.name}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                                    {ticket.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 font-mono truncate mb-2">{ticket.id}</p>
                                <p className="text-sm font-bold text-gray-900">
                                  ${tt.price.toFixed(2)} <span className="text-xs font-normal text-gray-400">USD</span>
                                </p>

                                {/* Availability bar */}
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Tickets remaining</span>
                                    <span className={remaining <= 10 ? "text-red-500 font-semibold" : ""}>
                                      {remaining} / {tt.quantity}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        remainingPct > 50 ? "bg-green-400" :
                                        remainingPct > 20 ? "bg-yellow-400" : "bg-red-400"
                                      }`}
                                      style={{ width: `${remainingPct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Download */}
                              <a
                                href={`/api/tickets/pdf/${ticket.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDF
                              </a>
                            </div>
                          </div>
                        )
                      })}

                      <div className="px-5 py-3 bg-gray-50 flex justify-between items-center text-xs text-gray-400">
                        <span className="font-mono truncate">{order.id}</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}