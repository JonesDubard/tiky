"use client"

import { useState } from "react"

export default function SandboxPage() {
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState(1)
  const [status, setStatus] = useState("")

  async function handlePay() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({
        phone,
        amount,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await res.json()
    setStatus(data.status)
  }

  return (
    <div className="p-8">
      <h1>MoMo Sandbox</h1>
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      <button onClick={handlePay}>
        Request Payment
      </button>

      <p>Status: {status}</p>
    </div>
  )
}
