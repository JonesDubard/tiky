"use client"

import Image from "next/image"

interface Props {
  label: string
  type: "MOMO" | "CARD"
  selected: boolean
  onClick: () => void
}

export default function PaymentOption({
  label,
  type,
  selected,
  onClick,
}: Props) {
  const isMomo = type === "MOMO"

  return (
    <div
      onClick={onClick}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
        selected
          ? isMomo
            ? "border-yellow-500 bg-yellow-50 shadow-md"
            : "border-brand-primary bg-brand-subtle shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {isMomo && (
            <Image
              src="/mtn-logo.png"
              alt="MTN Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          )}

          <p
            className={`font-semibold ${
              isMomo ? "text-yellow-700" : "text-gray-800"
            }`}
          >
            {label}
          </p>
        </div>

        {/* Right Side Indicator */}
        {selected && (
          <div
            className={`w-5 h-5 rounded-full ${
              isMomo ? "bg-yellow-500" : "bg-brand-primary"
            }`}
          />
        )}
      </div>
    </div>
  )
}
