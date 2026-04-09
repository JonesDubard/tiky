// app/admin/settings/page.tsx
// Simplified — header moved into client so the unsaved indicator
// can sit beside it naturally. Auth check stays here.

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import SettingsClient from "./SettingsClient"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure your platform,  changes take effect immediately
        </p>
      </div>
      <SettingsClient />
    </div>
  )
}