// app/(public)/checkout/card-processing/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CardProcessingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get("clientSecret")
  const orderId = searchParams.get("orderId")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Confirming your payment...")

  useEffect(() => {
    if (!clientSecret) {
      setStatus("error")
      setMessage("Missing payment information.")
      return
    }

    const confirmPayment = async () => {
      const stripe = await stripePromise
      if (!stripe) {
        setStatus("error")
        setMessage("Stripe failed to load.")
        return
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret)

      if (error) {
        setStatus("error")
        setMessage(error.message || "Payment confirmation failed.")
        return
      }

      if (paymentIntent?.status === "succeeded") {
        setStatus("success")
        setMessage("Payment confirmed! Generating your tickets...")

        // Small delay for UX then redirect to success
        setTimeout(() => {
          router.push(`/checkout/success?orderId=${orderId}&method=card`)
        }, 1500)

      } else if (
        paymentIntent?.status === "requires_payment_method" ||
        paymentIntent?.status === "canceled"
      ) {
        setStatus("error")
        setMessage("Payment was not completed. Please try again.")
      } else {
        // Still processing — poll again
        setTimeout(() => confirmPayment(), 2000)
      }
    }

    confirmPayment()
  }, [clientSecret, orderId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-sm">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-gray-600 font-medium">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-800 font-semibold text-lg">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-4">{message}</p>
            <button
              onClick={() => router.back()}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
