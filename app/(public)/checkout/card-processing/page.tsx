"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { useState } from "react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({
  orderId,
  quantities,
}: {
  orderId: string | null
  quantities: Record<string, number>
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setErrorMessage(null)

    const clientSecret = new URLSearchParams(window.location.search).get("clientSecret")
    if (!clientSecret) {
      setErrorMessage("Missing payment information.")
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setErrorMessage("Card element not found.")
      setLoading(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    })

    if (error) {
      setErrorMessage(error.message || "Payment failed. Please try again.")
      setLoading(false)
      return
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        // Notify backend to generate tickets and mark order complete
        await fetch("/api/payment/confirm-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, quantities }),
        })
      } catch (err) {
        console.error("Confirm card error:", err)
        // Don't block redirect even if this fails — tickets can be generated via webhook
      }

      router.push(`/checkout/success?orderId=${orderId}&method=card`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="border border-gray-300 rounded-xl p-4 bg-white focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  fontFamily: "system-ui, sans-serif",
                  "::placeholder": { color: "#9ca3af" },
                },
                invalid: { color: "#ef4444" },
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        🔒 Your payment is secured by Stripe
      </p>
    </form>
  )
}

export default function CardProcessingPage() {
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get("clientSecret")
  const orderId = searchParams.get("orderId")
  const quantitiesParam = searchParams.get("quantities")

  const quantities: Record<string, number> = (() => {
    if (!quantitiesParam) return {}
    try {
      return JSON.parse(decodeURIComponent(quantitiesParam))
    } catch {
      return {}
    }
  })()

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">Missing payment information.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Complete Your Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your card details below</p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret: decodeURIComponent(clientSecret),
            appearance: {
              theme: "stripe",
              variables: { colorPrimary: "#f97316" },
            },
          }}
        >
          <CheckoutForm orderId={orderId} quantities={quantities} />
        </Elements>
      </div>
    </div>
  )
}