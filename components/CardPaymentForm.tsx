"use client";
import { useState } from "react";

export default function CardPaymentForm({ onSuccess }: { onSuccess: (ref: string) => void }) {
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payment/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber, name, cvv, expiry }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Payment failed");
        setLoading(false);
        return;
      }

      onSuccess(data.referenceId);
    } catch (err: any) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        placeholder="Card Number"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Name on Card"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="CVV"
        value={cvv}
        onChange={(e) => setCvv(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Expiry (MM/YY)"
        value={expiry}
        onChange={(e) => setExpiry(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2 rounded">
        {loading ? "Processing..." : "Pay"}
      </button>
    </form>
  );
}
