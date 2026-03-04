"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"


type Ticket = {
  id: string
  name: string
  price: number
  event: {
    title: string
  }
}

type PaymentMethod = "card" | "mtn_momo" | "orange_money"

const PAYMENT_METHODS = [
  {
    id: "card" as PaymentMethod,
    label: "Pay with Card",
    description: "Visa, Mastercard, Amex",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: "border-blue-500 bg-blue-50",
    activeColor: "ring-2 ring-blue-500",
  },
  {
    id: "mtn_momo" as PaymentMethod,
    label: "MTN Mobile Money",
    description: "Pay with MTN MoMo",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: "border-yellow-400 bg-yellow-50",
    activeColor: "ring-2 ring-yellow-400",
  },
  {
    id: "orange_money" as PaymentMethod,
    label: "Orange Money",
    description: "Pay with Orange Money",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: "border-orange-400 bg-orange-50",
    activeColor: "ring-2 ring-orange-400",
  },
]

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const eventId = searchParams.get("eventId")
  const ticketsParam = searchParams.get("tickets")

  const [ticketsData, setTicketsData] = useState<Ticket[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const quantities: Record<string, number> = (() => {
    if (!ticketsParam) return {}
    try {
      return JSON.parse(ticketsParam)
    } catch {
      return {}
    }
  })()

  useEffect(() => {
    if (!eventId) return
    const fetchTickets = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/tickets`)
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data)) return
        setTicketsData(data)
      } catch (err) {
        console.error("Error fetching tickets:", err)
      } finally {
        setFetching(false)
      }
    }
    fetchTickets()
  }, [eventId])

  if (!ticketsParam) {
    return <div className="text-center mt-10 text-gray-500">No tickets selected.</div>
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center mt-10 gap-2 text-gray-500">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading your tickets...
      </div>
    )
  }

  const selectedTickets = ticketsData.filter(ticket => quantities[ticket.id])

  if (selectedTickets.length === 0) {
    return <div className="text-center mt-10 text-gray-500">Could not load selected tickets.</div>
  }

  const total = selectedTickets.reduce((sum, ticket) => {
    return sum + ticket.price * quantities[ticket.id]
  }, 0)

  const handleCheckout = async () => {
    if (!selectedMethod) return alert("Please select a payment method")
    if (selectedMethod === "card" && !email) return alert("Please enter your email")
    if ((selectedMethod === "mtn_momo" || selectedMethod === "orange_money") && !phoneNumber) {
      return alert("Please enter your phone number")
    }

    setLoading(true)

    const apiRoute =
      selectedMethod === "card"
        ? "/api/payment/initiate-card"
        : selectedMethod === "mtn_momo"
        ? "/api/payment/initiate-momo"
        : "/api/payment/initiate-orange"

    try {
      const res = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          quantities,
          email: selectedMethod === "card" ? email : undefined,
          phoneNumber: selectedMethod !== "card" ? phoneNumber : undefined,
          paymentMethod: selectedMethod,
        }),
      })

      if (!res.ok) {
        const errorBody = await res.json()
        throw new Error(errorBody?.message || errorBody?.error || "Payment failed")
      }

      const result = await res.json()

      if (selectedMethod === "card" && result.clientSecret) {
        router.push(
          `/checkout/card-processing?clientSecret=${encodeURIComponent(result.clientSecret)}&orderId=${result.orderId}&quantities=${encodeURIComponent(JSON.stringify(quantities))}`
        )
        return
      }

      if (result.redirectUrl) {
        router.push(result.redirectUrl)
        return
      }

      alert("Payment initiated successfully!")
    } catch (err: unknown) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  const buttonLabel = () => {
    if (loading) return "Processing..."
    if (!selectedMethod) return "Select a payment method"
    if (selectedMethod === "card") return "Pay with Card"
    if (selectedMethod === "mtn_momo") return "Pay with MTN MoMo"
    return "Pay with Orange Money"
  }

  return (
    <div className="max-w-lg mx-auto mt-10 px-4 pb-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
        <h2 className="font-semibold text-gray-700 mb-3">Purchase Summary</h2>
        {selectedTickets.map(ticket => (
          <div key={ticket.id} className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{ticket.name} × {quantities[ticket.id]}</span>
            <span>${(ticket.price * quantities[ticket.id]).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)} USD</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Select Payment Method</h2>
        <div className="space-y-3">
          {PAYMENT_METHODS.map(method => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                ${selectedMethod === method.id
                  ? `${method.color} ${method.activeColor}`
                  : "border-gray-200 bg-white hover:border-gray-300"
                }`}
            >
              <div className={`p-2 rounded-lg ${selectedMethod === method.id ? "bg-white shadow-sm" : "bg-gray-100"}`}>
                {method.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
              {selectedMethod === method.id && (
                <div className="ml-auto">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedMethod === "card" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
      )}

      {(selectedMethod === "mtn_momo" || selectedMethod === "orange_money") && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="+231 8XX XXX XXX"
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter the phone number linked to your{" "}
            {selectedMethod === "mtn_momo" ? "MTN MoMo" : "Orange Money"} account
          </p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading || !selectedMethod}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          selectedMethod && !loading
            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {buttonLabel()}
      </button>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center mt-10 gap-2 text-gray-500">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading checkout...
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}