// components/Payment/MockPaymentButton.tsx
'use client'

import { useState } from 'react'
import { CreditCard, Loader } from 'lucide-react'

interface MockPaymentButtonProps {
  eventId: string
}

export default function MockPaymentButton({ eventId }: MockPaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleMockPayment = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventId,
          quantity: 1
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        setError(result.error || 'Payment failed. Please try again.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('An error occurred during payment')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <button
        onClick={handleMockPayment}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Processing Mock Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Try Mock Payment</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mt-3 text-center">
        <p className="text-xs text-slate-500">
          ⚠️ This is a demo payment - no real money is charged
        </p>
      </div>
    </div>
  )
}