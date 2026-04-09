// app/admin/analytics/page.tsx
//
// FIX: ORGANIZER role was blocked here but the API allowed them.
// Now consistent — both page and API accept ADMIN and ORGANIZER.

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "lib/auth"
import AnalyticsClient from "./AnalyticsClient"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect("/login")

  // Match the API — both ADMIN and ORGANIZER can view analytics
  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    redirect("/unauthorized")
  }

  return (
    <div className="p-6">
      <AnalyticsClient />
    </div>
  )
}