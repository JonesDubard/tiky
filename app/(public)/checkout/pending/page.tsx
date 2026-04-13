"use client"

// app/(public)/checkout/pending/page.tsx
//
// CHANGES:
// 1. MTN MoMo: updated to merchant account flow (*156# → MoMo Pay → Merchant #)
//    Ref code shown as backup/memo, not primary identifier
// 2. Orange Money: corrected flow (*144# → currency → send money → to orange number)
// 3. File upload: removed capture="environment" — now shows OS picker sheet
//    (Camera / Photos / Files) so users can access existing screenshots

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "AWAITING_APPROVAL"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"

type OrderData = {
  id: string
  status: OrderStatus
  totalPrice: number
  referenceCode: string
  paymentMethod: string
  proofUrl: string | null
  proofNote: string | null
  tickets: {
    id: string
    status: string
    qrImage: string | null
    ticketType: {
      name: string
      event: { title: string }
    }
  }[]
}

type PaymentSettings = {
  mtnMomoNumber: string
  mtnMomoName: string
  orangeMoneyNumber: string
  orangeMoneyName: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  supportPhone: string
}

const METHOD_LABELS: Record<string, string> = {
  mtn_momo: "MTN Mobile Money",
  orange_money: "Orange Money",
  bank_transfer: "Bank Transfer",
}

const SETTINGS_FALLBACK: PaymentSettings = {
  mtnMomoNumber: "",
  mtnMomoName: "Future Group International",
  orangeMoneyNumber: "",
  orangeMoneyName: "Future Group International",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "Future Group International",
  supportPhone: "",
}

// ── Inner component ───────────────────────────────────────────────────────────

function PendingPageInner() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(SETTINGS_FALLBACK)

  // Upload state
  const [uploadStep, setUploadStep] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Polling
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch payment settings (public endpoint, no auth needed)
  useEffect(() => {
    fetch("/api/payment-settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPaymentSettings((p) => ({ ...p, ...data })) })
      .catch(() => {})
  }, [])

  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Order not found")
      const data: OrderData = await res.json()
      setOrder(data)
      return data
    } catch {
      setError("Could not load your order. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  // Poll after proof upload until COMPLETED or REJECTED
  useEffect(() => {
    if (uploadSuccess && order?.status === "AWAITING_APPROVAL") {
      setPolling(true)
      pollRef.current = setInterval(async () => {
        const updated = await fetchOrder()
        if (updated?.status === "COMPLETED" || updated?.status === "REJECTED") {
          setPolling(false)
          clearInterval(pollRef.current!)
        }
      }, 10_000)
    }
    return () => clearInterval(pollRef.current!)
  }, [uploadSuccess, order?.status, fetchOrder])

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File too large. Max 10MB.")
      return
    }
    setSelectedFile(file)
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = (e) => setFilePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!orderId) return
    if (!selectedFile && !transactionId.trim()) {
      setUploadError("Please upload a screenshot or enter your transaction ID")
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      if (selectedFile) formData.append("proof", selectedFile)
      if (transactionId.trim()) formData.append("proofNote", transactionId.trim())
      const res = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: "POST",
        body: formData,
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? "Upload failed")
      setUploadSuccess(true)
      setUploadStep(false)
      await fetchOrder()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  // ── Guard renders ─────────────────────────────────────────────────────────

  if (!orderId) {
    return (
      <div className="max-w-lg mx-auto mt-16 px-4 text-center">
        <p className="text-gray-500">No order ID provided.</p>
        <Link href="/events" className="text-orange-500 text-sm mt-2 inline-block">Browse events</Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading your order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto mt-16 px-4 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-700 font-medium">{error ?? "Order not found"}</p>
        <Link href="/events" className="text-orange-500 text-sm mt-3 inline-block">Back to events</Link>
      </div>
    )
  }

  const methodLabel = METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod
  const isMomo = order.paymentMethod === "mtn_momo"
  const isOrange = order.paymentMethod === "orange_money"
  const isBank = order.paymentMethod === "bank_transfer"

  const supportLink = paymentSettings.supportPhone
    ? `https://wa.me/${paymentSettings.supportPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi, I need help with order ref: ${order.referenceCode}`
      )}`
    : null

  // ── COMPLETED ─────────────────────────────────────────────────────────────

  if (order.status === "COMPLETED") {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{"You're confirmed! 🎉"}</h1>
          <p className="text-gray-500 text-sm mt-1">Your payment was verified. Here are your tickets.</p>
        </div>
        <div className="space-y-4">
          {order.tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-orange-500 px-5 py-4 text-white">
                <p className="text-xs opacity-80 uppercase tracking-wider">{ticket.ticketType.name}</p>
                <p className="font-bold text-lg">{ticket.ticketType.event.title}</p>
              </div>
              <div className="p-5 text-center">
                {ticket.qrImage ? (
                  <img src={ticket.qrImage} alt="QR Code" className="w-44 h-44 mx-auto rounded-xl border-4 border-gray-50" />
                ) : (
                  <div className="w-44 h-44 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                    <p className="text-gray-400 text-xs">Generating QR...</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-3 font-mono">{ticket.id}</p>
              </div>
              <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                <a
                  href={`/api/tickets/pdf/${ticket.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl text-center"
                >
                  Download PDF
                </a>
                <button
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `My ticket for ${ticket.ticketType.event.title}!\nTicket ID: ${ticket.id}\nView: ${window.location.origin}/my-tickets`
                    )
                    window.open(`https://wa.me/?text=${msg}`, "_blank")
                  }}
                  className="flex-1 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-xl"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
        <Link href="/my-tickets" className="block text-center text-sm text-orange-500 font-medium mt-6 hover:text-orange-600 transition-colors">
          View all my tickets →
        </Link>
        <Link href="/events" className="block text-center text-sm text-gray-400 mt-3 hover:text-orange-500 transition-colors">
          Browse more events
        </Link>
      </div>
    )
  }

  // ── REJECTED ──────────────────────────────────────────────────────────────

  if (order.status === "REJECTED") {
    const reason = order.proofNote?.replace("REJECTED: ", "")
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Payment Not Confirmed</h1>
          {reason && <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">{reason}</p>}
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-red-700">
            Reference: <span className="font-bold font-mono">{order.referenceCode}</span>
          </p>
          <p className="text-xs text-red-500 mt-1">
            Please ensure you used this reference code when making the transfer.
          </p>
        </div>
        <button
          onClick={() => setUploadStep(true)}
          className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-colors"
        >
          Resubmit Proof of Payment
        </button>
        {supportLink && (
          <a href={supportLink} target="_blank" rel="noreferrer"
            className="block text-center text-sm text-green-600 font-medium mt-4"
          >
            Contact support on WhatsApp
          </a>
        )}
      </div>
    )
  }

  // ── PENDING / AWAITING ────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto py-8 px-4 pb-20">

      {/* Status banner */}
      {(order.status === "AWAITING_APPROVAL" || uploadSuccess) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="text-blue-500 mt-0.5 flex-shrink-0">
            {polling ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Proof received — verifying payment</p>
            <p className="text-xs text-blue-600 mt-0.5">
              We usually confirm within 15–30 minutes. This page will update automatically.
            </p>
          </div>
        </div>
      )}

      {/* Reference code */}
      <div className="bg-gray-900 text-white rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-orange-500 -translate-y-1/2 translate-x-1/2" />
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Your Reference Code</p>
        <p className="text-4xl font-black tracking-widest text-orange-400 font-mono mb-3">
          {order.referenceCode}
        </p>
        <p className="text-xs text-gray-400">
          Keep this safe — you may need it to confirm your payment
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(order.referenceCode)}
          className="mt-3 text-xs bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg"
        >
          Copy code
        </button>
      </div>

      {/* Order summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order Summary</span>
          <span className="text-xs text-gray-400 font-mono">{order.id.slice(0, 12)}...</span>
        </div>
        {order.tickets.map((ticket) => (
          <div key={ticket.id} className="flex justify-between text-sm text-gray-700 mb-1">
            <span>{ticket.ticketType.name}</span>
            <span className="text-gray-400">× 1</span>
          </div>
        ))}
        <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total to pay</span>
          <span>${order.totalPrice.toFixed(2)} USD</span>
        </div>
      </div>

      {/* Payment instructions */}
      {!uploadStep && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">📋</span>
            </div>
            <h2 className="font-semibold text-gray-900">Payment Instructions</h2>
            <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
              {methodLabel}
            </span>
          </div>

          <ol className="space-y-3">

            {/* ── MTN MoMo — Merchant account flow ─────────────────────────── */}
            {isMomo && (
              <>
                <Step n={1} text="Dial *156# on your MTN line" />
                <Step n={2} text={`Select "MoMo Pay"`} />
                <Step n={3}>
                  Enter merchant number:{" "}
                  <strong className="font-mono">
                    {paymentSettings.mtnMomoNumber || "—"}
                  </strong>
                  <br />
                  <span className="text-gray-400 text-xs">{paymentSettings.mtnMomoName}</span>
                </Step>
                <Step n={4} text="Select your currency (LRD or USD)" />
                <Step n={5} text={`Enter amount: $${order.totalPrice.toFixed(2)} USD`} />
                <Step n={6} text="Enter your MoMo PIN to confirm" />
                <Step n={7} text="Screenshot the confirmation message" />

                {/* Reference code as backup */}
                <li className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      If asked for a reference or memo:
                    </p>
                    <p className="text-sm font-mono font-bold text-orange-600 mt-0.5">
                      {order.referenceCode}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      This helps us match your payment if there are any issues.
                    </p>
                  </div>
                </li>
              </>
            )}

            {/* ── Orange Money flow ─────────────────────────────────────────── */}
            {isOrange && (
              <>
                <Step n={1} text="Dial *144# on your Orange line" />
                <Step n={2} text="Select your currency (LRD or USD)" />
                <Step n={3} text={`Select "Send Money"`} />
                <Step n={4} text={`Select "To Orange Number"`} />
                <Step n={5}>
                  Enter number:{" "}
                  <strong className="font-mono">
                    {paymentSettings.orangeMoneyNumber || "—"}
                  </strong>
                  <br />
                  <span className="text-gray-400 text-xs">{paymentSettings.orangeMoneyName}</span>
                </Step>
                <Step n={6} text={`Enter amount: $${order.totalPrice.toFixed(2)} USD`} />
                <Step n={7} text="Enter your PIN to confirm" />
                <Step n={8} text="Screenshot your confirmation SMS" />

                {/* Reference code as backup */}
                <li className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      Your reference code (for support):
                    </p>
                    <p className="text-sm font-mono font-bold text-orange-600 mt-0.5">
                      {order.referenceCode}
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Keep this in case we need to verify your payment manually.
                    </p>
                  </div>
                </li>
              </>
            )}

            {/* ── Bank Transfer ─────────────────────────────────────────────── */}
            {isBank && (
              <>
                <Step n={1}>
                  Bank: <strong>{paymentSettings.bankName || "—"}</strong>
                </Step>
                <Step n={2}>
                  Account name: <strong>{paymentSettings.bankAccountName}</strong>
                </Step>
                <Step n={3}>
                  Account number:{" "}
                  <strong className="font-mono">{paymentSettings.bankAccountNumber || "—"}</strong>
                </Step>
                <Step n={4} text={`Amount: $${order.totalPrice.toFixed(2)} USD`} />
                <Step n={5}>
                  Narration/Reference:{" "}
                  <strong className="font-mono text-orange-600">{order.referenceCode}</strong>
                  <span className="block text-xs text-red-500 mt-0.5">
                    Required — this is how we identify your payment
                  </span>
                </Step>
                <Step n={6} text="Photograph your bank slip or teller receipt" />
              </>
            )}
          </ol>
        </div>
      )}

      {/* CTA */}
      {!uploadStep && order.status === "PENDING_CONFIRMATION" && (
        <button
          onClick={() => setUploadStep(true)}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors shadow-sm"
        >
          I Have Paid — Upload Proof →
        </button>
      )}

      {/* Upload form */}
      {uploadStep && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upload Proof of Payment</h2>
            <button onClick={() => setUploadStep(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* FIX: No capture attribute — shows full OS picker (Camera / Photos / Files) */}
          {/* This lets mobile users who already took the screenshot access their gallery */}
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${
              filePreview
                ? "border-green-300 bg-green-50"
                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              // FIX: No capture="environment" — lets user choose camera OR gallery
            />
            {filePreview ? (
              <div>
                <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                <p className="text-xs text-green-600 font-medium mt-2">{selectedFile?.name} ✓</p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-2">📎</div>
                <p className="text-sm font-medium text-gray-700">
                  Tap to upload screenshot
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Choose from Camera, Photos, or Files · JPG, PNG up to 10MB
                </p>
              </>
            )}
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Transaction ID */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Enter Transaction ID / Receipt Number
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="e.g. 1234567890"
            />
          </div>

          {uploadError && (
            <p className="text-sm text-red-500 mb-3 bg-red-50 rounded-xl px-3 py-2">{uploadError}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || (!selectedFile && !transactionId.trim())}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
              !uploading && (selectedFile || transactionId.trim())
                ? "bg-gray-900 hover:bg-gray-800 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Submitting...
              </span>
            ) : "Submit Proof"}
          </button>
        </div>
      )}

      {/* Submitted state */}
      {(order.status === "AWAITING_APPROVAL" || uploadSuccess) && !uploadStep && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-blue-800">Proof submitted ✓</p>
          <p className="text-xs text-blue-600 mt-1">
            {"We're"} reviewing your payment. {"You'll"} receive your tickets once confirmed.
          </p>
          {polling && (
            <p className="text-xs text-blue-400 mt-2 flex items-center justify-center gap-1.5">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Checking for updates...
            </p>
          )}
        </div>
      )}

      {/* Support */}
      {supportLink && (
        <p className="text-center text-xs text-gray-400 mt-6">
          Questions?{" "}
          <a href={supportLink} target="_blank" rel="noreferrer" className="text-green-600 font-medium">
            WhatsApp support
          </a>
        </p>
      )}
    </div>
  )
}

// ── Step helper ───────────────────────────────────────────────────────────────

function Step({ n, text, children }: { n: number; text?: string; children?: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span className="text-sm text-gray-700 leading-relaxed">{text ?? children}</span>
    </li>
  )
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PendingPageInner />
    </Suspense>
  )
}