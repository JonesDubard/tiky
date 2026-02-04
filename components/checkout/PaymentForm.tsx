// components/checkout/PaymentForm.tsx
'use client'

import { useState } from 'react'
import { Loader2, Smartphone, CreditCard } from 'lucide-react'

interface PaymentFormProps {
  eventId: string
  ticketId: string
  ticketType: string
  amount: number
  userId?: string
}

export default function PaymentForm({ eventId, ticketId, ticketType, amount, userId }: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleMomoPayment = async () => {
    if (!phoneNumber.match(/^(077|088|055)\d{7}$/)) {
      setError('Please enter a valid MTN MoMo number (077, 088, or 055)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          ticketId,
          userId,
          phoneNumber
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      setSuccess(true)
      // In production: Handle redirection to MoMo app
      alert(`Payment initiated! Complete payment on your phone for ticket: ${ticketType}`)
      
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Complete Payment</h3>
      
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Order Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Ticket Type:</span>
              <span className="font-medium">{ticketType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Amount:</span>
              <span className="font-bold text-xl text-brand-accent">${amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-4">Select Payment Method</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MTN MoMo */}
            <button
              onClick={handleMomoPayment}
              disabled={loading}
              className="p-4 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900">MTN MoMo</h3>
                  <p className="text-sm text-slate-500">Pay via mobile money</p>
                </div>
              </div>
            </button>

            {/* Card Payment (Future) */}
            <button
              disabled
              className="p-4 border-2 border-slate-200 rounded-xl opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-400">Card Payment</h3>
                  <p className="text-sm text-slate-400">Coming soon</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Phone Number Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            MTN MoMo Phone Number
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="0771234567"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={10}
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter your MTN Liberia number (077, 088, or 055)
              </p>
            </div>
            <button
              onClick={handleMomoPayment}
              disabled={loading || !phoneNumber}
              className="btn-primary px-8 py-3 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-emerald-700 font-medium">
              ✅ Payment initiated! Check your phone to complete the transaction.
            </p>
            <p className="text-sm text-emerald-600 mt-1">
              You will receive a confirmation email once payment is confirmed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}