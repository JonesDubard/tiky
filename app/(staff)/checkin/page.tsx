"use client"

import { useState } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"

export default function CheckInPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleScan(text: string) {
    if (!text || loading) return

    setLoading(true)

    const res = await fetch("/api/tickets/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode: text }),
    })

    const json = await res.json()
    setResult(json)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl mb-6">Event Check-In</h1>

      <div className="w-full max-w-md">
        <Scanner
          onScan={(result) => {
            if (result.length > 0) {
              handleScan(result[0].rawValue)
            }
          }}
          onError={(error) => console.error(error)}
        />
      </div>

      {result && (
        <div
          className={`mt-6 p-6 rounded-lg text-center text-xl font-bold ${
            result.success ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {result.success ? "✅ Entry Granted" : `❌ ${result.error}`}
        </div>
      )}
    </div>
  )
}
