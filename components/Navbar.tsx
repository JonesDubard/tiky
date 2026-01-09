// app/(public)/components/Nav.tsx
"use client"

import Link from "next/link"
import { Bell, Sun, User } from "lucide-react"

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <Link href="/" className="text-xl font-black tracking-tight hover:opacity-80">
            TIKY
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100" aria-label="Theme">
            <Sun className="w-5 h-5 text-gray-700" />
          </button>
          <Link href="/login" className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-orange-400">
            <User className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </nav>
  )
}