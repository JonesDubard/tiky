"use client"

// app/(public)/my-tickets/MyTicketsClient.tsx
//
// Wallet-style ticket display. Mobile-first.
// Design direction: warm, physical, card-like — feels like holding a real ticket.
// Torn-edge divider separates ticket header from QR section.
// Status in plain English — no ALLCAPS database values shown to users.

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import type { OrderWithTickets, TicketItem } from "./page"

// ── Types ─────────────────────────────────────────────────────────────────────

type TabKey = "upcoming" | "pending" | "used" | "all"

// ── Status helpers ────────────────────────────────────────────────────────────

type StatusDisplay = {
  label: string
  sublabel: string
  color: string
  badge: string
  actionable: boolean
}

function getStatusDisplay(
  ticketStatus: string,
  orderStatus: string
): StatusDisplay {
  // RESERVED + order AWAITING_APPROVAL → proof submitted, waiting admin
  if (ticketStatus === "RESERVED" && orderStatus === "AWAITING_APPROVAL") {
    return {
      label: "Verifying payment",
      sublabel: "We received your proof. Usually confirmed within 30 minutes.",
      color: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      actionable: false,
    }
  }

  // RESERVED + order PENDING_CONFIRMATION → user hasn't submitted proof yet
  if (ticketStatus === "RESERVED" && orderStatus === "PENDING_CONFIRMATION") {
    return {
      label: "Awaiting payment",
      sublabel: "Transfer the total and upload your proof to confirm this ticket.",
      color: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      actionable: true, // Show "Upload Proof" link
    }
  }

  // RESERVED + REJECTED → payment rejected
  if (ticketStatus === "RESERVED" && orderStatus === "REJECTED") {
    return {
      label: "Payment not confirmed",
      sublabel: "Your proof could not be verified. Please resubmit.",
      color: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-700",
      actionable: true,
    }
  }

  // PAID → confirmed, ready to use
  if (ticketStatus === "PAID") {
    return {
      label: "Ready to use",
      sublabel: "Show this QR code at the entrance.",
      color: "bg-white border-gray-200",
      badge: "bg-green-100 text-green-700",
      actionable: false,
    }
  }

  // USED → already scanned
  if (ticketStatus === "USED") {
    return {
      label: "Used",
      sublabel: "This ticket has already been scanned.",
      color: "bg-gray-50 border-gray-200",
      badge: "bg-gray-100 text-gray-500",
      actionable: false,
    }
  }

  // CANCELLED / EXPIRED
  return {
    label: "Cancelled",
    sublabel: "This ticket is no longer valid.",
    color: "bg-gray-50 border-gray-200",
    badge: "bg-gray-100 text-gray-400",
    actionable: false,
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  mtn_momo: "MTN MoMo",
  orange_money: "Orange Money",
  bank_transfer: "Bank Transfer",
  card: "Card",
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MyTicketsClient({
  orders: initialOrders,
  userName,
}: {
  orders: OrderWithTickets[]
  userName: string
}) {
  const [orders, setOrders] = useState<OrderWithTickets[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming")
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Flatten all tickets with their parent order for easier rendering
  const allTickets = orders.flatMap((order) =>
    order.tickets.map((ticket) => ({ ticket, order }))
  )

  // Refresh data (poll for status changes after proof upload)
  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/user/orders")
      if (!res.ok) return
      const data: OrderWithTickets[] = await res.json()
      setOrders(data)
    } catch {
      // Silently fail — stale data is fine
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Auto-refresh every 30s if user has pending tickets
  useEffect(() => {
    const hasPending = allTickets.some(
      ({ ticket, order }) =>
        ticket.status === "RESERVED" &&
        ["PENDING_CONFIRMATION", "AWAITING_APPROVAL"].includes(order.status)
    )
    if (!hasPending) return

    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [allTickets, refresh])

  // ── Tab filtering ───────────────────────────────────────────────────────

  const now = new Date()

  function tabTickets(tab: TabKey) {
    return allTickets.filter(({ ticket, order }) => {
      if (tab === "all") return true
      if (tab === "pending") {
        return ticket.status === "RESERVED"
      }
      if (tab === "used") {
        return ticket.status === "USED" || ticket.status === "CANCELLED"
      }
      if (tab === "upcoming") {
        const eventDate = new Date(ticket.ticketType.event.date)
        return ticket.status === "PAID" && eventDate >= now
      }
      return true
    })
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: tabTickets("upcoming").length },
    { key: "pending", label: "Pending", count: tabTickets("pending").length },
    { key: "used", label: "Past", count: tabTickets("used").length },
    { key: "all", label: "All", count: allTickets.length },
  ]

  const visibleTickets = tabTickets(activeTab)

  // ── Empty state ─────────────────────────────────────────────────────────

  if (allTickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No tickets yet</h2>
          <p className="text-gray-500 text-sm mb-6">
            When you purchase a ticket, it will appear here ready to scan.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 pt-8 pb-0 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                My Tickets
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {userName}
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <svg
                className={`w-4 h-4 text-gray-600 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "text-orange-600 border-orange-500 bg-orange-50"
                    : "text-gray-500 border-transparent hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.key
                        ? "bg-orange-500 text-white"
                        : tab.key === "pending" && tab.count > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Ticket list ─────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {visibleTickets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No tickets in this category</p>
            <button
              onClick={() => setActiveTab("all")}
              className="text-orange-500 text-sm mt-2 font-medium"
            >
              View all tickets
            </button>
          </div>
        ) : (
          visibleTickets.map(({ ticket, order }) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              order={order}
              isExpanded={expandedTicket === ticket.id}
              onToggle={() =>
                setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
              }
            />
          ))
        )}

        {/* Browse more */}
        <div className="pt-4 pb-8 text-center">
          <Link
            href="/events"
            className="text-sm text-gray-400 hover:text-orange-500 transition-colors"
          >
            Browse more events →
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Ticket Card ───────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  order,
  isExpanded,
  onToggle,
}: {
  ticket: TicketItem
  order: OrderWithTickets
  isExpanded: boolean
  onToggle: () => void
}) {
  const status = getStatusDisplay(ticket.status, order.status)
  const event = ticket.ticketType.event
  const eventDate = new Date(event.date)
  const isPaid = ticket.status === "PAID"
  const isUsed = ticket.status === "USED"
  const isPending = ticket.status === "RESERVED"
  const isCancelled = ticket.status === "CANCELLED"

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(
      `My ticket for ${event.title}\n` +
        `Date: ${eventDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}\n` +
        `Ticket ID: ${ticket.id}\n` +
        `View: ${window.location.origin}/my-tickets`
    )
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  return (
    <div
      className={`rounded-3xl border-2 overflow-hidden transition-all shadow-sm ${status.color} ${
        isUsed || isCancelled ? "opacity-70" : ""
      }`}
    >
      {/* ── Ticket header ─────────────────────────────────────────────── */}
      <div
        className={`relative px-5 pt-5 pb-4 ${
          isPaid
            ? "bg-gradient-to-br from-orange-500 to-amber-500"
            : isPending
            ? "bg-gradient-to-br from-gray-700 to-gray-800"
            : "bg-gradient-to-br from-gray-400 to-gray-500"
        }`}
      >
        {/* Event image blur background */}
        {event.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
        )}

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <span
              className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${status.badge}`}
            >
              {status.label}
            </span>
            <h3 className="text-white font-black text-lg leading-tight line-clamp-2">
              {event.title}
            </h3>
            <p className="text-white/70 text-sm mt-1">{ticket.ticketType.name}</p>
          </div>

          {/* Date badge */}
          <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 text-center text-white">
            <p className="text-2xl font-black leading-none">
              {eventDate.getDate()}
            </p>
            <p className="text-xs uppercase tracking-wide opacity-80">
              {eventDate.toLocaleString("default", { month: "short" })}
            </p>
            <p className="text-xs opacity-60">
              {eventDate.getFullYear()}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="relative flex items-center gap-1.5 mt-3 text-white/70 text-xs">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>
      </div>

      {/* ── Torn edge divider ─────────────────────────────────────────── */}
      <div className="flex items-center bg-white">
        <div className="w-5 h-5 rounded-full bg-gray-50 border-r-2 border-dashed border-gray-200 -ml-2.5 flex-shrink-0" />
        <div className="flex-1 border-t-2 border-dashed border-gray-200" />
        <div className="w-5 h-5 rounded-full bg-gray-50 border-l-2 border-dashed border-gray-200 -mr-2.5 flex-shrink-0" />
      </div>

      {/* ── QR / status section ───────────────────────────────────────── */}
      <div className="bg-white px-5 py-5">
        {/* Status message */}
        {status.sublabel && (
          <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
            {status.sublabel}
          </p>
        )}

        {/* QR code or placeholder */}
        <div className="flex flex-col items-center mb-4">
          {isPaid && ticket.qrImage ? (
            <>
              <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                <img
                  src={ticket.qrImage}
                  alt="Ticket QR Code"
                  className="w-48 h-48"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono">
                Scan to verify at entrance
              </p>
            </>
          ) : isPending ? (
            <div className="w-48 h-48 bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-gray-400 text-center px-4">
                QR code generated after payment is confirmed
              </p>
            </div>
          ) : isUsed ? (
            <div className="w-48 h-48 bg-green-50 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-green-100">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-green-600 font-semibold">Ticket scanned</p>
            </div>
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
              <p className="text-xs text-gray-400">Not available</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {/* Pending: go to payment page */}
          {status.actionable && order.referenceCode && (
            <Link
              href={`/checkout/pending?orderId=${order.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-colors"
            >
              {order.status === "REJECTED"
                ? "Resubmit Payment Proof"
                : "Upload Payment Proof →"}
            </Link>
          )}

          {/* Paid: download PDF + WhatsApp */}
          {isPaid && (
            <div className="flex gap-2">
              <a
                href={`/api/tickets/pdf/${ticket.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Save PDF
              </a>
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-500 text-white text-sm font-semibold rounded-2xl hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share
              </button>
            </div>
          )}
        </div>

        {/* Toggle detail */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-1 mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          {isExpanded ? "Hide details" : "Show details"}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Expanded order details ─────────────────────────────────────── */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-dashed border-gray-200 px-5 py-4 space-y-3">
          <InfoRow label="Ticket ID" value={ticket.id} mono />
          <InfoRow label="Event" value={event.title} />
          <InfoRow
            label="Date & Time"
            value={new Date(event.date).toLocaleString("en-US", {
              weekday: "short",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
          <InfoRow label="Ticket type" value={ticket.ticketType.name} />
          <InfoRow label="Price" value={`$${ticket.ticketType.price.toFixed(2)}`} />
          {order.referenceCode && (
            <InfoRow label="Reference code" value={order.referenceCode} mono />
          )}
          {order.paymentMethod && (
            <InfoRow
              label="Payment method"
              value={METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
            />
          )}
          <InfoRow
            label="Order status"
            value={order.status.replace(/_/g, " ")}
          />
          <InfoRow
            label="Purchased"
            value={new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          />
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">{label}</span>
      <span
        className={`text-xs text-right text-gray-700 ${
          mono ? "font-mono break-all" : "font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  )
}