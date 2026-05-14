"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
}

interface Props {
  eventId: string
  tickets: TicketType[]
}

export default function TicketPurchaseCard({ eventId, tickets }: Props) {

  if (!tickets || tickets.length === 0) {
    return null;
  }
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const handleIncrease = (id: string, max: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.min((prev[id] || 0) + 1, max)
    }))
  }

  const handleDecrease = (id: string) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max((prev[id] || 0) - 1, 0)
    }))
  }

  const totalAmount = tickets.reduce((sum, ticket) => {
    const qty = quantities[ticket.id] || 0
    return sum + qty * ticket.price
  }, 0)

  const totalTicketsSelected = Object.values(quantities).reduce((a, b) => a + b, 0)

  const handleCheckout = () => {
  if (totalTicketsSelected === 0) return

  // Remove zero quantities before sending
  const selectedQuantities = Object.fromEntries(
    Object.entries(quantities).filter(([_, qty]) => qty > 0)
  )

  const query = new URLSearchParams({
    eventId,
    tickets: JSON.stringify(selectedQuantities),
  })
  console.log("eventId being sent:", eventId) 
  console.log("Routing to:", `/checkout?${query.toString()}`)

  router.push(`/checkout?${query.toString()}`)
}

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Tickets</h2>

      <div className="space-y-6">
        {tickets.map(ticket => {
          const qty = quantities[ticket.id] || 0

          return (
            <div
              key={ticket.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">
                  {ticket.name}
                </h3>
                <span className="text-lg font-bold text-brand-primary">
                  ${ticket.price} USD
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {ticket.quantity} available
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDecrease(ticket.id)}
                    className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    −
                  </button>

                  <span className="font-semibold text-lg w-6 text-center">
                    {qty}
                  </span>

                  <button
                    onClick={() => handleIncrease(ticket.id, ticket.quantity)}
                    className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                <span className="font-semibold text-gray-700">
                  ${(qty * ticket.price).toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6">
        <div className="flex justify-between text-lg font-semibold mb-4">
          <span>Total</span>
          <span>${totalAmount.toFixed(2)} USD</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={totalTicketsSelected === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            totalTicketsSelected > 0
              ? "bg-brand-primary text-white hover:bg-brand-accent"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Continue to Checkout
        </button>
      </div>
    </div>
  )
}
