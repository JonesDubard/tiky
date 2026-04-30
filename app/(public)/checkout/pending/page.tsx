// "use client"

// // app/(public)/checkout/pending/page.tsx

// import { useEffect, useState, Suspense } from "react"
// import { useRouter, useSearchParams } from "next/navigation"
// import { CheckCircle, XCircle, RefreshCw, Smartphone, Ticket } from "lucide-react"

// type PollStatus = "waiting" | "processing" | "completed" | "failed"

// function PendingInner() {
//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const orderId = searchParams.get("orderId")
//   const method = searchParams.get("method") ?? "mtn_momo"

//   const [status, setStatus] = useState<PollStatus>("waiting")
//   const [elapsedSec, setElapsed] = useState(0)
//   const [errorMsg, setErrorMsg] = useState("")
//   const [redirecting, setRedirecting] = useState(false)

//   const MAX_ATTEMPTS = 100

//   // ── Elapsed timer ────────────────────────────────────────────────────────
//   useEffect(() => {
//     const timer = setInterval(() => setElapsed(s => s + 1), 1000)
//     return () => clearInterval(timer)
//   }, [])

//   // ── Immediate check + polling ────────────────────────────────────────────
//   useEffect(() => {
//     if (!orderId) {
//       setStatus("failed")
//       setErrorMsg("No order ID found. Please contact support.")
//       return
//     }

//     // Immediate check on mount
//     const immediateCheck = async () => {
//       try {
//         const res = await fetch(`/api/payment/status?orderId=${orderId}`)
//         const data = await res.json()
//         console.log("[PENDING IMMEDIATE] Status:", data)
//         if (data.orderStatus === "COMPLETED") {
//             setStatus("completed")
//             setRedirecting(true)
//             router.push(`/checkout/success?orderId=${orderId}`)
//             return
// }
//       } catch (e) {
//         console.error("Immediate check failed", e)
//       }
//       // If not completed, start polling
//       startPolling()
//     }

//     let isStopped = false
//     let attempt = 0

//     const startPolling = () => {
//       const poll = async () => {
//         if (isStopped || redirecting) return
//         try {
//           const res = await fetch(`/api/payment/status?orderId=${orderId}`)
//           const data = await res.json()
//           console.log(`[POLLING #${attempt}]`, data)

//           if (data.orderStatus === "COMPLETED" && data.ticketsReady) {
//             setStatus("completed")
//             setRedirecting(true)
//             console.log("✅ Payment complete – redirecting to success page")
//             router.push(`/checkout/success?orderId=${orderId}`)
//             return
//           }

//           if (data.orderStatus === "PROCESSING") {
//             setStatus("processing")
//             attempt++
//             if (!isStopped && !redirecting) setTimeout(poll, 3000)
//             return
//           }

//           if (data.orderStatus === "FAILED" || data.orderStatus === "CANCELLED") {
//             setStatus("failed")
//             setErrorMsg(data.error ?? "Payment was not completed.")
//             return
//           }

//           // Still PENDING
//           attempt++
//           if (attempt >= MAX_ATTEMPTS) {
//             setStatus("failed")
//             setErrorMsg(
//               "Payment confirmation timed out. If you approved the payment on your phone, your tickets will be sent to you shortly — or contact support with your order ID."
//             )
//             return
//           }

//           if (!isStopped && !redirecting) setTimeout(poll, 5000)
//         } catch (err) {
//           console.error("Poll request failed", err)
//           attempt++
//           if (!isStopped && !redirecting && attempt < MAX_ATTEMPTS) {
//             setTimeout(poll, 5000)
//           }
//         }
//       }

//       // Start polling after a short initial delay
//       setTimeout(poll, 2000)
//     }

//     immediateCheck()

//     return () => {
//       isStopped = true
//     }
//   }, [orderId, router, redirecting])

//   const minutes = Math.floor(elapsedSec / 60)
//   const seconds = elapsedSec % 60
//   const elapsedLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

//   // ── Completed ──────────────────────────────────────────────────────────
//   if (status === "completed") {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
//           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <CheckCircle className="w-9 h-9 text-green-600" />
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h1>
//           <p className="text-gray-500 text-sm">Preparing your tickets…</p>
//           <div className="mt-6 flex justify-center">
//             <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // ── Processing ─────────────────────────────────────────────────────────
//   if (status === "processing") {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
//           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Ticket className="w-9 h-9 text-blue-600" />
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h1>
//           <p className="text-gray-500 text-sm mb-4">
//             Generating your QR tickets — this takes just a moment.
//           </p>
//           <div className="flex justify-center">
//             <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // ── Failed ─────────────────────────────────────────────────────────────
//   if (status === "failed") {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
//           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <XCircle className="w-9 h-9 text-red-500" />
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
//           <p className="text-gray-500 text-sm mb-2">{errorMsg}</p>
//           {orderId && (
//             <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 mt-2 break-all">
//               Order: {orderId}
//             </p>
//           )}
//           <div className="flex flex-col gap-2 mt-6">
//             <button
//               onClick={() => router.back()}
//               className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm"
//             >
//               Try Again
//             </button>
//             <a
//               href="/events"
//               className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm text-center block"
//             >
//               Browse Events
//             </a>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   // ── Waiting / polling ─────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">

//         {/* Animated phone */}
//         <div className="relative w-20 h-20 mx-auto mb-6">
//           <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
//             <Smartphone className="w-10 h-10 text-yellow-600" />
//           </div>
//           <span className="absolute -top-1 -right-1 flex h-4 w-4">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
//             <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500" />
//           </span>
//         </div>

//         <h1 className="text-xl font-bold text-gray-900 mb-2">Check Your Phone</h1>
//         <p className="text-gray-500 text-sm mb-6 leading-relaxed">
//           {method === "mtn_momo"
//             ? "An MTN MoMo payment request has been sent to your phone. Open the prompt and enter your PIN to confirm."
//             : "A payment request has been sent to your phone. Please approve it to complete your purchase."}
//         </p>

//         {/* Steps */}
//         <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-6">
//           {[
//             "Open the MTN MoMo notification on your phone",
//             "Enter your MoMo PIN when prompted",
//             "Wait for confirmation here — don't close this page",
//           ].map((text, i) => (
//             <div key={i} className="flex items-start gap-3">
//               <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold flex items-center justify-center mt-0.5">
//                 {i + 1}
//               </span>
//               <p className="text-sm text-gray-600">{text}</p>
//             </div>
//           ))}
//         </div>

//         {/* Polling indicator */}
//         <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
//           <RefreshCw className="w-3.5 h-3.5 animate-spin" />
//           <span>Waiting for confirmation ({elapsedLabel})</span>
//         </div>

//         {orderId && (
//           <p className="text-xs text-gray-300 font-mono mt-4 break-all">
//             Order: {orderId.slice(0, 20)}…
//           </p>
//         )}

//         {/* Fallback manual button after 90 seconds */}
//         {elapsedSec >= 90 && (
//           <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
//             <p className="text-xs font-semibold text-amber-800 mb-1">Taking longer than expected?</p>
//             <p className="text-xs text-amber-700 mb-3">
//               If you approved the payment on your phone but nothing has happened here,
//               please contact support with your order ID above. Or click below to view your tickets (if ready).
//             </p>
//             <a
//               href={`/checkout/success?orderId=${orderId}`}
//               className="w-full py-2 bg-amber-100 text-amber-900 rounded-lg font-medium text-xs text-center block"
//             >
//               View My Tickets Now
//             </a>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// export default function PendingPage() {
//   return (
//     <Suspense fallback={
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
//       </div>
//     }>
//       <PendingInner />
//     </Suspense>
//   )
// }

"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, RefreshCw, Smartphone, Ticket } from "lucide-react"

type PageStatus = "waiting" | "processing" | "completed" | "failed"

function PendingInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const orderId      = searchParams.get("orderId")
  const method       = searchParams.get("method") ?? "mtn_momo"

  const [pageStatus, setPageStatus] = useState<PageStatus>("waiting")
  const [elapsedSec, setElapsed]    = useState(0)
  const [errorMsg, setErrorMsg]     = useState("")

  // Use ref so polling closure always sees the current value
  const isStopped = useRef(false)
  const attempt   = useRef(0)
  const MAX_ATTEMPTS = 60 // 60 × 5s = 5 minutes

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) {
      setPageStatus("failed")
      setErrorMsg("No order ID found. Please contact support.")
      return
    }

    isStopped.current = false
    attempt.current   = 0

    const redirect = (dest: string) => {
      isStopped.current = true
      router.push(dest)
    }

    const poll = async () => {
      if (isStopped.current) return

      try {
        const res  = await fetch(`/api/payment/status?orderId=${orderId}`, {
  cache: 'no-store'
})
        const data = await res.json() as {
          orderStatus:  string
          ticketsReady?: boolean
          error?:       string
        }

        console.log(`[PENDING poll #${attempt.current}]`, data)

        // ── Redirect on COMPLETED — don't wait for ticketsReady ─────────────
        // The success page shows a loading state while QR generates
        if (data.orderStatus === "COMPLETED") {
          setPageStatus("completed")
          redirect(`/checkout/success?orderId=${orderId}`)
          return
        }

        // ── Payment confirmed, tickets still generating ──────────────────────
        if (data.orderStatus === "PROCESSING") {
          setPageStatus("processing")
          // Poll faster during processing
          attempt.current++
          if (!isStopped.current) setTimeout(poll, 2000)
          return
        }

        // ── Definitively failed ──────────────────────────────────────────────
        if (data.orderStatus === "FAILED" || data.orderStatus === "CANCELLED") {
          setPageStatus("failed")
          setErrorMsg(data.error ?? "Payment was not completed. Please try again.")
          return
        }

        // ── Still PENDING — keep polling ─────────────────────────────────────
        attempt.current++
        if (attempt.current >= MAX_ATTEMPTS) {
          setPageStatus("failed")
          setErrorMsg(
            "Confirmation timed out. If you approved the payment on your phone, " +
            "your tickets are being processed — contact support with your order ID."
          )
          return
        }

        if (!isStopped.current) setTimeout(poll, 5000)

      } catch (err) {
        console.error("[PENDING] Poll error:", err)
        attempt.current++
        if (!isStopped.current && attempt.current < MAX_ATTEMPTS) {
          setTimeout(poll, 5000)
        }
      }
    }

    // First poll immediately, then every 5s
    poll()

    return () => { isStopped.current = true }
  }, [orderId, router])

  const minutes     = Math.floor(elapsedSec / 60)
  const secs        = elapsedSec % 60
  const elapsedLabel = minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`

  // ── Completed (redirect in progress) ──────────────────────────────────────
  if (pageStatus === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h1>
          <p className="text-gray-500 text-sm">Loading your tickets…</p>
          <div className="mt-6 flex justify-center">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (pageStatus === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-9 h-9 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h1>
          <p className="text-gray-500 text-sm mb-4">
            Generating your QR tickets — just a moment…
          </p>
          <div className="flex justify-center">
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (pageStatus === "failed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-500 text-sm mb-3 leading-relaxed">{errorMsg}</p>
          {orderId && (
            <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 break-all">
              Order: {orderId}
            </p>
          )}
          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={() => router.back()}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm"
            >
              Try Again
            </button>
            {/* Emergency escape hatch — shows ticket if payment actually went through */}
            {orderId && (
              <a
                href={`/checkout/success?orderId=${orderId}`}
                className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm text-center block"
              >
                Check My Tickets
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Waiting ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">

        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-yellow-600" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500" />
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Check Your Phone</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          {method === "mtn_momo"
            ? "An MTN MoMo payment request has been sent to your phone. Open the prompt and enter your PIN to confirm."
            : "A payment request has been sent to your phone. Please approve it to complete your purchase."}
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-6">
          {[
            "Open the MTN MoMo notification on your phone",
            "Enter your MoMo PIN when prompted",
            "Wait here — don't close this page",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Waiting for confirmation ({elapsedLabel})</span>
        </div>

        {orderId && (
          <p className="text-xs text-gray-300 font-mono mt-3 break-all">
            Order: {orderId.slice(0, 20)}…
          </p>
        )}

        {/* After 30s — give user a manual escape hatch */}
        {elapsedSec >= 30 && (
          <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <p className="text-xs font-semibold text-amber-800 mb-1">
              Taking longer than expected?
            </p>
            <p className="text-xs text-amber-700 mb-2">
              If you already approved on your phone, tap below to check your tickets.
            </p>
            <a
              href={`/checkout/success?orderId=${orderId}`}
              className="block w-full py-2 bg-amber-500 text-white rounded-lg font-semibold text-xs text-center"
            >
              View My Tickets
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    }>
      <PendingInner />
    </Suspense>
  )
}