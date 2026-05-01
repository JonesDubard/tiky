// "use client"

// // app/(public)/checkout/page.tsx
// //
// // CHANGES FROM ORIGINAL:
// // - Removed "card" (Stripe) — replaced with "bank_transfer"
// // - mtn_momo + orange_money + bank_transfer all route to /api/payment/initiate-manual
// // - Redirects to /checkout/pending instead of Stripe's card-processing
// // - Phone number required for MoMo; no extra input for bank transfer

// import React, { useState, useEffect, Suspense } from "react"
// import { useRouter, useSearchParams } from "next/navigation"

// type Ticket = {
//   id: string
//   name: string
//   price: number
//   event: { title: string }
// }

// type PaymentMethod = "mtn_momo" | "orange_money" | "bank_transfer"

// const PAYMENT_METHODS = [
//   {
//     id: "mtn_momo" as PaymentMethod,
//     label: "MTN Mobile Money",
//     description: "Transfer via MTN MoMo",
//     badge: "Most Popular",
//     icon: (
//       <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
//         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
//       </svg>
//     ),
//     color: "border-yellow-400 bg-yellow-50 text-yellow-700",
//     activeColor: "ring-2 ring-yellow-400 border-yellow-400",
//     needsPhone: true,
//   },
//   {
//     id: "orange_money" as PaymentMethod,
//     label: "Orange Money",
//     description: "Transfer via Orange Money",
//     badge: null,
//     icon: (
//       <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
//         <circle cx="12" cy="12" r="10" />
//       </svg>
//     ),
//     color: "border-orange-400 bg-orange-50 text-orange-700",
//     activeColor: "ring-2 ring-orange-400 border-orange-400",
//     needsPhone: true,
//   },
//   {
//     id: "bank_transfer" as PaymentMethod,
//     label: "Bank Transfer",
//     description: "Ecobank · UBA · Any bank",
//     badge: null,
//     icon: (
//       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//         />
//       </svg>
//     ),
//     color: "border-blue-400 bg-blue-50 text-blue-700",
//     activeColor: "ring-2 ring-blue-400 border-blue-400",
//     needsPhone: false,
//   },
// ]

// function CheckoutInner() {
//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const eventId = searchParams.get("eventId")
//   const ticketsParam = searchParams.get("tickets")

//   const [ticketsData, setTicketsData] = useState<Ticket[]>([])
//   const [fetching, setFetching] = useState(true)
//   const [loading, setLoading] = useState(false)
//   const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
//   const [phoneNumber, setPhoneNumber] = useState("")
//   const [error, setError] = useState<string | null>(null)

//   const quantities: Record<string, number> = (() => {
//     if (!ticketsParam) return {}
//     try { return JSON.parse(ticketsParam) } catch { return {} }
//   })()

//   useEffect(() => {
//     if (!eventId) return
//     fetch(`/api/events/${eventId}/tickets`)
//       .then((r) => r.json())
//       .then((data) => Array.isArray(data) && setTicketsData(data))
//       .catch(console.error)
//       .finally(() => setFetching(false))
//   }, [eventId])

//   if (!ticketsParam) {
//     return <div className="text-center mt-10 text-gray-500">No tickets selected.</div>
//   }

//   if (fetching) {
//     return (
//       <div className="flex items-center justify-center mt-16 gap-2 text-gray-400">
//         <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
//           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//         </svg>
//         Loading checkout...
//       </div>
//     )
//   }

//   const selectedTickets = ticketsData.filter((t) => quantities[t.id])
//   if (selectedTickets.length === 0) {
//     return <div className="text-center mt-10 text-gray-500">Could not load selected tickets.</div>
//   }

//   const total = selectedTickets.reduce((sum, t) => sum + t.price * quantities[t.id], 0)
//   const selectedMethodDef = PAYMENT_METHODS.find((m) => m.id === selectedMethod)

//   const handleCheckout = async () => {
//     setError(null)

//     if (!selectedMethod) return setError("Please select a payment method")
//     if (selectedMethodDef?.needsPhone && !phoneNumber.trim()) {
//       return setError("Please enter your phone number")
//     }

//     setLoading(true)
//     try {
//       const res = await fetch("/api/payment/initiate-manual", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           eventId,
//           quantities,
//           paymentMethod: selectedMethod,
//           phoneNumber: selectedMethodDef?.needsPhone ? phoneNumber.trim() : undefined,
//         }),
//       })

//       const result = await res.json()

//       if (!res.ok) throw new Error(result.error ?? "Failed to create order")

//       router.push(result.redirectUrl)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Something went wrong")
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="max-w-lg mx-auto mt-8 px-4 pb-20">
//       {/* Header */}
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
//         <p className="text-sm text-gray-500 mt-1">
//           {selectedTickets[0]?.event?.title}
//         </p>
//       </div>

//       {/* Order summary */}
//       <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
//         <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
//           Order Summary
//         </h2>
//         {selectedTickets.map((ticket) => (
//           <div key={ticket.id} className="flex justify-between text-sm text-gray-700 mb-2">
//             <span>
//               {ticket.name}
//               <span className="text-gray-400 ml-1">× {quantities[ticket.id]}</span>
//             </span>
//             <span className="font-medium">
//               ${(ticket.price * quantities[ticket.id]).toFixed(2)}
//             </span>
//           </div>
//         ))}
//         <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900 text-base">
//           <span>Total</span>
//           <span>${total.toFixed(2)} USD</span>
//         </div>
//       </div>

//       {/* How payment works */}
//       <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
//         <div className="flex gap-3">
//           <div className="text-2xl">💡</div>
//           <div>
//             <p className="text-sm font-semibold text-amber-800 mb-1">How this works</p>
//             <p className="text-xs text-amber-700 leading-relaxed">
//               Select your payment method, then transfer the total to us using the
//               reference code we give you. Upload your receipt and we'll confirm
//               your ticket — usually within minutes.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Payment method selection */}
//       <div className="mb-6">
//         <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
//           Payment Method
//         </h2>
//         <div className="space-y-3">
//           {PAYMENT_METHODS.map((method) => {
//             const isSelected = selectedMethod === method.id
//             return (
//               <button
//                 key={method.id}
//                 onClick={() => { setSelectedMethod(method.id); setError(null) }}
//                 className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left relative ${
//                   isSelected
//                     ? `${method.activeColor} bg-white shadow-sm`
//                     : "border-gray-200 bg-white hover:border-gray-300"
//                 }`}
//               >
//                 {method.badge && (
//                   <span className="absolute top-2 right-2 text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">
//                     {method.badge}
//                   </span>
//                 )}
//                 <div
//                   className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
//                     isSelected ? method.color : "bg-gray-100 text-gray-500"
//                   }`}
//                 >
//                   {method.icon}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
//                   <p className="text-xs text-gray-500">{method.description}</p>
//                 </div>
//                 {isSelected && (
//                   <div className="flex-shrink-0">
//                     <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
//                       <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                   </div>
//                 )}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* Phone number input for MoMo methods */}
//       {selectedMethodDef?.needsPhone && (
//         <div className="mb-6">
//           <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
//             {selectedMethod === "mtn_momo" ? "MTN" : "Orange"} Phone Number
//           </label>
//           <div className="relative">
//             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
//               🇱🇷
//             </span>
//             <input
//               type="tel"
//               value={phoneNumber}
//               onChange={(e) => setPhoneNumber(e.target.value)}
//               className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
//               placeholder="+231 00 000 0000"
//               inputMode="tel"
//             />
//           </div>
//           <p className="text-xs text-gray-400 mt-1.5">
//             This is the number linked to your {selectedMethodDef.label} account
//           </p>
//         </div>
//       )}

//       {/* Error message */}
//       {error && (
//         <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
//           <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//           </svg>
//           <p className="text-red-600 text-sm">{error}</p>
//         </div>
//       )}

//       {/* CTA button */}
//       <button
//         onClick={handleCheckout}
//         disabled={loading || !selectedMethod}
//         className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-sm ${
//           selectedMethod && !loading
//             ? "bg-gray-900 hover:bg-gray-800 text-white"
//             : "bg-gray-100 text-gray-400 cursor-not-allowed"
//         }`}
//       >
//         {loading ? (
//           <span className="flex items-center justify-center gap-2">
//             <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//             </svg>
//             Creating your order...
//           </span>
//         ) : selectedMethod ? (
//           `Continue with ${selectedMethodDef?.label} →`
//         ) : (
//           "Select a payment method to continue"
//         )}
//       </button>

//       <p className="text-center text-xs text-gray-400 mt-4">
//         🔒 Your order is secured. No payment until you transfer manually.
//       </p>
//     </div>
//   )
// }

// export default function CheckoutPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className="flex items-center justify-center mt-16 gap-2 text-gray-400">
//           <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
//             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//           </svg>
//           Loading checkout...
//         </div>
//       }
//     >
//       <CheckoutInner />
//     </Suspense>
//   )
// }

"use client"

// app/(public)/checkout/page.tsx
//
// Payment method routing:
//   mtn_momo     → POST /api/payment/initiate-momo  (real MTN API, USSD push)
//   orange_money → POST /api/payment/initiate-manual (manual flow, upload proof)
//   bank_transfer→ POST /api/payment/initiate-manual (manual flow, upload proof)

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Ticket = {
  id: string
  name: string
  price: number
  event: { title: string }
}

type PaymentMethod = "mtn_momo" | "orange_money" | "bank_transfer"

const PAYMENT_METHODS = [
  {
    id: "mtn_momo" as PaymentMethod,
    label: "MTN Mobile Money",
    description: "Instant — approve on your phone",
    badge: "Recommended",
    color: "border-yellow-400 bg-yellow-50 text-yellow-700",
    activeColor: "ring-2 ring-yellow-400 border-yellow-400",
    needsPhone: true,
    isInstant: true,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
  },
  // {
  //   id: "orange_money" as PaymentMethod,
  //   label: "Orange Money",
  //   description: "Transfer manually, upload receipt",
  //   badge: null,
  //   color: "border-orange-400 bg-orange-50 text-orange-700",
  //   activeColor: "ring-2 ring-orange-400 border-orange-400",
  //   needsPhone: false,
  //   isInstant: false,
  //   icon: (
  //     <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
  //       <circle cx="12" cy="12" r="10" />
  //     </svg>
  //   ),
  // },
  // {
  //   id: "bank_transfer" as PaymentMethod,
  //   label: "Bank Transfer",
  //   description: "Ecobank · UBA · Any bank",
  //   badge: null,
  //   color: "border-blue-400 bg-blue-50 text-blue-700",
  //   activeColor: "ring-2 ring-blue-400 border-blue-400",
  //   needsPhone: false,
  //   isInstant: false,
  //   icon: (
  //     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
  //         d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  //     </svg>
  //   ),
  // },
]

function CheckoutInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const eventId      = searchParams.get("eventId")
  const ticketsParam = searchParams.get("tickets")

  const [ticketsData, setTicketsData]     = useState<Ticket[]>([])
  const [fetching, setFetching]           = useState(true)
  const [loading, setLoading]             = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [phoneNumber, setPhoneNumber]     = useState("")
  const [error, setError]                 = useState<string | null>(null)

  const quantities: Record<string, number> = (() => {
    if (!ticketsParam) return {}
    try { return JSON.parse(ticketsParam) } catch { return {} }
  })()

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}/tickets`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setTicketsData(data))
      .catch(console.error)
      .finally(() => setFetching(false))
  }, [eventId])

  if (!ticketsParam) {
    return <div className="text-center mt-10 text-gray-500">No tickets selected.</div>
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center mt-16 gap-2 text-gray-400">
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading checkout...
      </div>
    )
  }

  const selectedTickets = ticketsData.filter(t => quantities[t.id])
  if (selectedTickets.length === 0) {
    return <div className="text-center mt-10 text-gray-500">Could not load selected tickets.</div>
  }

  const total = selectedTickets.reduce((sum, t) => sum + t.price * quantities[t.id], 0)
  const selectedMethodDef = PAYMENT_METHODS.find(m => m.id === selectedMethod)

  const handleCheckout = async () => {
    setError(null)
    if (!selectedMethod) return setError("Please select a payment method")
    if (selectedMethod === "mtn_momo" && !phoneNumber.trim()) {
      return setError("Please enter your MTN MoMo phone number")
    }

    setLoading(true)
    try {
      // ── Route: MTN MoMo → real API (USSD push) ──────────────────────────
      if (selectedMethod === "mtn_momo") {
        const res = await fetch("/api/payment/initiate-momo", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ eventId, quantities, phoneNumber: phoneNumber.trim() }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error ?? "Payment initiation failed")
        // Redirect to polling page — customer approves on their phone
        router.push(result.redirectUrl)
        return
      }

      // ── Route: Orange Money / Bank Transfer → manual flow ────────────────
      const res = await fetch("/api/payment/initiate-manual", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ eventId, quantities, paymentMethod: selectedMethod }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? "Failed to create order")
      router.push(result.redirectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-8 px-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">{selectedTickets[0]?.event?.title}</p>
      </div>

      {/* Order summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Order Summary
        </h2>
        {selectedTickets.map(ticket => (
          <div key={ticket.id} className="flex justify-between text-sm text-gray-700 mb-2">
            <span>
              {ticket.name}
              <span className="text-gray-400 ml-1">× {quantities[ticket.id]}</span>
            </span>
            <span className="font-medium">${(ticket.price * quantities[ticket.id]).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between font-bold text-gray-900 text-base">
          <span>Total</span>
          <span>${total.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Payment method selection */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Payment Method
        </h2>
        <div className="space-y-3">
          {PAYMENT_METHODS.map(method => {
            const isSelected = selectedMethod === method.id
            return (
              <button
                key={method.id}
                onClick={() => { setSelectedMethod(method.id); setError(null) }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left relative ${
                  isSelected
                    ? `${method.activeColor} bg-white shadow-sm`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {method.badge && (
                  <span className="absolute top-2 right-2 text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">
                    {method.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isSelected ? method.color : "bg-gray-100 text-gray-500"
                }`}>
                  {method.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                  {method.isInstant && (
                    <p className="text-xs text-green-600 font-medium mt-0.5">
                      ⚡ Tickets issued instantly after approval
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Phone input — only for MTN MoMo */}
      {selectedMethod === "mtn_momo" && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            MTN MoMo Phone Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">🇱🇷</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="+231 88 000 0000"
              inputMode="tel"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            A payment prompt will be sent to this number. Make sure it has MoMo enabled and sufficient balance.
          </p>
        </div>
      )}

      {/* Manual flow notice — orange money and bank transfer */}
      {(selectedMethod === "orange_money" || selectedMethod === "bank_transfer") && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">How this works</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                You'll receive a reference code and payment instructions.
                Transfer the amount, upload your receipt, and we'll confirm your
                tickets — usually within minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleCheckout}
        disabled={loading || !selectedMethod}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-sm ${
          selectedMethod && !loading
            ? "bg-gray-900 hover:bg-gray-800 text-white"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {selectedMethod === "mtn_momo" ? "Sending payment request…" : "Creating your order…"}
          </span>
        ) : selectedMethod === "mtn_momo" ? (
          "Pay with MTN MoMo →"
        ) : selectedMethod ? (
          `Continue with ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label} →`
        ) : (
          "Select a payment method to continue"
        )}
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">
        🔒 Your order is secured.
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center mt-16 gap-2 text-gray-400">
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