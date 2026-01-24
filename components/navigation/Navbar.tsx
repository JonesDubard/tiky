"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Sun, Moon, Bell } from "lucide-react"
import { useSession } from "next-auth/react"

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/home" className="text-xl font-black">
          Tikky
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-4">

          {/* Polls */}
          <Link href="/polls">
            <Bell className="h-5 w-5" />
          </Link>

          {/* Theme Toggle */}
          {/* <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button> */}

          {/* Admin shortcut */}
          {session?.user?.role === "ADMIN" && (
            <Link
              href="/admin/dashboard"
              className="px-3 py-1 rounded-md bg-black text-white text-sm"
            >
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
