// app/admin/tickets/validate/page.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, QrCode, RefreshCw, Keyboard } from "lucide-react"

type ValidationResult = {
  valid: boolean
  alreadyUsed?: boolean
  error?: string
  validatedAt?: string
  ticket?: {
    id: string
    event: string
    eventDate?: string
    location?: string
    ticketType: string
    price?: number
    holder: string
    email?: string | null
    validatedAt?: string
  }
}

export default function ValidateTicketPage() {
  const [mode, setMode] = useState<"manual" | "camera">("manual")
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount and after each scan
  useEffect(() => {
    if (mode === "manual") {
      inputRef.current?.focus()
    }
  }, [mode, result])

  const validateTicket = async (qrCode: string) => {
    if (!qrCode.trim()) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      })

      const data = await res.json()
      setResult(data)
      setScanCount(c => c + 1)
    } catch (err) {
      setResult({ valid: false, error: "Network error. Please try again." })
    } finally {
      setLoading(false)
      setInputValue("")
      // Re-focus for next scan
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validateTicket(inputValue)
  }

  const handleReset = () => {
    setResult(null)
    setInputValue("")
    inputRef.current?.focus()
  }

  const resultBg = result
    ? result.valid
      ? "bg-green-50 border-green-200"
      : result.alreadyUsed
      ? "bg-yellow-50 border-yellow-200"
      : "bg-red-50 border-red-200"
    : ""

  const ResultIcon = result
    ? result.valid
      ? CheckCircle
      : result.alreadyUsed
      ? AlertCircle
      : XCircle
    : null

  const iconColor = result
    ? result.valid
      ? "text-green-500"
      : result.alreadyUsed
      ? "text-yellow-500"
      : "text-red-500"
    : ""

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Validator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan or enter a ticket QR code to validate entry
        </p>
      </div>

      {/* Scan counter */}
      {scanCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 flex items-center justify-between">
          <span className="text-blue-700 text-sm font-medium">
            Tickets validated this session
          </span>
          <span className="text-blue-900 font-bold text-lg">{scanCount}</span>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "manual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual / Scanner
        </button>
        <button
          onClick={() => setMode("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "camera"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <QrCode className="w-4 h-4" />
          Camera (coming soon)
        </button>
      </div>

      {/* Input form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Code / Ticket ID
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Scan QR code or paste ticket ID..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              autoComplete="off"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-5 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Validate"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 If using a barcode scanner, just scan — it submits automatically
          </p>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border-2 p-6 ${resultBg}`}>
          <div className="flex items-start gap-4">
            {ResultIcon && (
              <ResultIcon className={`w-8 h-8 flex-shrink-0 mt-0.5 ${iconColor}`} />
            )}
            <div className="flex-1">
              {result.valid ? (
                <>
                  <h2 className="text-green-800 font-bold text-lg mb-1">✅ Valid Ticket</h2>
                  <p className="text-green-700 text-sm mb-4">Entry granted — ticket marked as used</p>
                  {result.ticket && (
                    <div className="bg-white rounded-xl p-4 space-y-2 border border-green-100">
                      <Row label="Event" value={result.ticket.event} />
                      <Row label="Ticket type" value={result.ticket.ticketType} />
                      <Row label="Holder" value={result.ticket.holder} />
                      {result.ticket.email && (
                        <Row label="Email" value={result.ticket.email} />
                      )}
                      {result.ticket.location && (
                        <Row label="Location" value={result.ticket.location} />
                      )}
                      {result.ticket.validatedAt && (
                        <Row
                          label="Validated at"
                          value={new Date(result.ticket.validatedAt).toLocaleTimeString()}
                        />
                      )}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-mono break-all">
                          ID: {result.ticket.id}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : result.alreadyUsed ? (
                <>
                  <h2 className="text-yellow-800 font-bold text-lg mb-1">⚠️ Already Used</h2>
                  <p className="text-yellow-700 text-sm mb-3">
                    This ticket was already scanned
                    {result.validatedAt && (
                      <> at {new Date(result.validatedAt).toLocaleString()}</>
                    )}
                  </p>
                  {result.ticket && (
                    <div className="bg-white rounded-xl p-4 border border-yellow-100">
                      <Row label="Event" value={result.ticket.event} />
                      <Row label="Holder" value={result.ticket.holder} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-red-800 font-bold text-lg mb-1">❌ Invalid Ticket</h2>
                  <p className="text-red-700 text-sm">{result.error || "This ticket is not valid"}</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 w-full py-2 rounded-xl border border-current text-sm font-medium transition-all hover:opacity-80"
          >
            Scan Next Ticket
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}