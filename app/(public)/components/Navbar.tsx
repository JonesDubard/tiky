// app/(public)/components/Nav.tsx
"use client"

import Link from "next/link"
import { Bell, Sun, User } from "lucide-react"

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B35] to-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <Link href="/" className="text-xl font-black tracking-tight hover:opacity-80">
            TIKKY
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          
          {/* Poll Icon */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition"
            aria-label="Live Polls"
          >
            <Bell className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition"
            aria-label="Toggle Dark Mode"
          >
            <Sun className="w-5 h-5 text-gray-700" />
          </button>

          {/* Avatar/Login */}
          <Link
            href="/login"
            className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center hover:ring-2 hover:ring-[#FF6B35]/40 transition"
            aria-label="User Profile"
          >
            <User className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </nav>
  )
}
