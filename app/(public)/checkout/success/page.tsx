"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"


type TicketInstance = {
  id: string
  qrCode: string
  qrImage: string
  status: string
  ticketType: {
    name: string
    price: number
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
  tickets: TicketInstance[]
  payments: {
    paymentMethod: string
    status: string
    amount: number
    currency: string
  }[]
}

function SuccessInner() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const method = searchParams.get("method")

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTicket, setActiveTicket] = useState(0)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    let attempts = 0
    const maxAttempts = 8
    let stopped = false

    const fetchOrder = async () => {
      if (stopped) return
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error("Failed to fetch order")
        const data: Order = await res.json()
        setOrder(data)

        if (data.tickets.length > 0) {
          setLoading(false)
          return
        }

        if (attempts === 0 && method === "card") {
          try {
            await fetch("/api/payment/confirm-card", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId }),
            })
          } catch (err) {
            console.error("confirm-card fallback failed:", err)
          }
        }

        if (attempts < maxAttempts) {
          attempts++
          setTimeout(fetchOrder, 2000)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching order:", err)
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(fetchOrder, 2000)
        } else {
          setLoading(false)
        }
      }
    }

    fetchOrder()
    return () => {
      stopped = true
    }
  }, [orderId, method])

  const handleDownloadPDF = (ticketId: string) => {
    window.open(`/api/tickets/pdf/${ticketId}`, "_blank")
  }

  const handleWhatsAppShare = (ticket: TicketInstance) => {
    const event = ticket.ticketType.event
    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const message = encodeURIComponent(
      `My Tiky Ticket\n\n` +
      `Event: ${event.title}\n` +
      `Ticket: ${ticket.ticketType.name}\n` +
      `Date: ${eventDate}\n` +
      `Location: ${event.location}\n` +
      `Ticket ID: ${ticket.id}\n\n` +
      `View your ticket at: ${window.location.origin}/tickets/${ticket.id}`
    )
    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-gray-600 font-medium">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found.</p>
      </div>
    )
  }

  const methodLabel: Record<string, string> = {
    card: "Credit / Debit Card",
    mtn_momo: "MTN Mobile Money",
    orange_money: "Orange Money",
  }
  const paymentMethodKey = order.payments[0]?.paymentMethod ?? method ?? ""
  const paymentLabel = methodLabel[paymentMethodKey] ?? paymentMethodKey
  const ticket = order.tickets[activeTicket]
  const event = ticket?.ticketType?.event
  const eventDate = event ? new Date(event.date) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-lg mx-auto px-4 py-12">

        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{"You're In!"}</h1>
          <p className="text-gray-500 text-sm">Payment confirmed via {paymentLabel}</p>
        </div>

        {order.tickets.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
            <p className="text-yellow-800 font-semibold text-lg">Generating your tickets...</p>
            <p className="text-yellow-600 text-sm mt-1">This usually takes a few seconds.</p>
            <p className="text-yellow-500 text-xs mt-3">
              Your order ID: <span className="font-mono">{order.id}</span>
            </p>
          </div>
        ) : (
          <div>
            {order.tickets.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {order.tickets.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(i)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeTicket === i
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    Ticket {i + 1}
                  </button>
                ))}
              </div>
            )}

            {ticket && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-orange-100 text-xs font-medium uppercase tracking-widest mb-1">
                        {ticket.ticketType.name}
                      </p>
                      <h2 className="text-xl font-bold leading-tight truncate">{event?.title}</h2>
                    </div>
                    {eventDate && (
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center ml-4 flex-shrink-0">
                        <p className="text-2xl font-bold leading-none">{eventDate.getDate()}</p>
                        <p className="text-xs uppercase tracking-wide">
                          {eventDate.toLocaleString("default", { month: "short" })}
                        </p>
                      </div>
                    )}
                  </div>
                  {event?.location && (
                    <div className="mt-4 flex items-center gap-2 text-orange-100 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center px-6">
                  <div className="w-6 h-6 rounded-full bg-orange-50 -ml-9 flex-shrink-0" />
                  <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
                  <div className="w-6 h-6 rounded-full bg-orange-50 -mr-9 flex-shrink-0" />
                </div>

                <div className="p-6 text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-4 font-medium">Scan to verify</p>
                  {ticket.qrImage ? (
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                      <img src={ticket.qrImage} alt="Ticket QR Code" className="w-48 h-48 mx-auto" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                      <p className="text-gray-400 text-sm">QR not available</p>
                    </div>
                  )}
                  <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-1">Ticket ID</p>
                    <p className="font-mono text-sm text-gray-700 font-semibold tracking-wider break-all">{ticket.id}</p>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
                    <span>Price paid</span>
                    <span className="font-bold text-gray-800 text-base">${ticket.ticketType.price.toFixed(2)} USD</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => ticket && handleDownloadPDF(ticket.id)}
                disabled={!ticket}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Ticket PDF
              </button>

              <button
                onClick={() => ticket && handleWhatsAppShare(ticket)}
                disabled={!ticket}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all disabled:opacity-50 shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share via WhatsApp
              </button>

              <a
                href="/events"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium hover:border-orange-300 hover:text-orange-500 transition-all"
              >
                Browse More Events
              </a>
            </div>

            <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Order ID</span>
                  <span className="font-mono text-xs text-gray-700 truncate ml-4">{order.id}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tickets</span>
                  <span className="font-semibold text-gray-800">{order.tickets.length}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Payment method</span>
                  <span className="text-gray-800">{paymentLabel}</span>
                </div>
                <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total paid</span>
                  <span>${order.totalPrice.toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessInner />
    </Suspense>
  )
}