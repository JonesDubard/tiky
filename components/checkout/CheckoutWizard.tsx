"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CheckoutWizard({ event, selectedTickets }: any) {
  const router = useRouter()
  const [step, setStep] = useState(2)
  const [paymentMethod, setPaymentMethod] = useState("CARD") // default to CARD
  const [loading, setLoading] = useState(false)

  const ticketTypes = event.ticketTypes.filter((t: any) => selectedTickets[t.id] > 0)

  const totalAmount = ticketTypes.reduce((sum: number, ticket: any) => {
    return sum + selectedTickets[ticket.id] * ticket.price
  }, 0)

  const handlePayment = async () => {
    if (loading) return
    setLoading(true)

    try {
      const ticketsPayload = Object.entries(selectedTickets)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([ticketTypeId, qty]) => ({
          ticketTypeId,
          quantity: Number(qty),
        }))

      if (ticketsPayload.length === 0) {
        alert("Please select at least one ticket")
        setLoading(false)
        return
      }

      // For card sandbox/demo, we simulate payment success
      const res = await fetch("/api/payment/initiate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user-id",
          tickets: ticketsPayload,
          paymentMethod,
        }),
      })

      const data = await res.json()
      console.log("Card payment response:", data)

      if (!data.success) {
        alert(data.error || "Payment initiation failed")
        setLoading(false)
        return
      }

      // Simulate redirect to payment gateway or confirmation page
      router.push(`/checkout/processing?ref=${data.referenceId}`)
    } catch (error: any) {
      console.error("Payment error:", error)
      alert(error.message || "Something went wrong during payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">

        {/* Progress Bar */}
        <div className="flex justify-between mb-10">
          <Step label="Select" active={step >= 1} />
          <Step label="Review" active={step >= 2} />
          <Step label="Pay" active={step >= 3} />
        </div>

        {/* STEP 2 — REVIEW */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>
            <div className="space-y-4">
              {ticketTypes.map((ticket: any) => (
                <div key={ticket.id} className="flex justify-between border-b pb-2">
                  <span>{ticket.name} × {selectedTickets[ticket.id]}</span>
                  <span>${(selectedTickets[ticket.id] * ticket.price).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xl font-bold mt-6">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setStep(3)}
              className="mt-8 w-full bg-brand-primary text-white py-3 rounded-lg"
            >
              Continue to Payment
            </button>
          </>
        )}

        {/* STEP 3 — PAYMENT */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Choose Payment Method</h2>
            <div className="space-y-4 mb-8">
              <PaymentOption
                label="Debit / Credit Card"
                selected={paymentMethod === "CARD"}
                onClick={() => setPaymentMethod("CARD")}
              />
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-brand-primary text-white py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Processing..." : `Pay $${totalAmount.toFixed(2)}`}
            </button>
          </>
        )}

      </div>
    </div>
  )
}

function Step({ label, active }: any) {
  return (
    <div className="flex-1 text-center">
      <div className={`h-2 mb-2 rounded ${active ? "bg-brand-primary" : "bg-gray-200"}`} />
      <p className={`text-sm ${active ? "font-bold" : "text-gray-400"}`}>{label}</p>
    </div>
  )
}

function PaymentOption({ label, selected, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer ${selected ? "border-brand-primary bg-brand-subtle" : "border-gray-200"}`}
    >
      {label}
    </div>
  )
}
