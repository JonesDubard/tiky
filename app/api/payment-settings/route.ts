// app/api/payment-settings/route.ts
//
// PUBLIC endpoint — no auth required.
// Returns ONLY the payment account details needed for the checkout
// instructions page. Does NOT expose sensitive settings.
//
// Why separate from /api/admin/settings?
// The pending page is viewed by unauthenticated users (guests who just
// bought a ticket). The admin settings API requires ADMIN role. This
// endpoint is intentionally minimal and read-only.

import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"

const PUBLIC_KEYS = [
  "mtnMomoNumber",
  "mtnMomoName",
  "orangeMoneyNumber",
  "orangeMoneyName",
  "bankName",
  "bankAccountNumber",
  "bankAccountName",
  "supportPhone",
] as const

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [...PUBLIC_KEYS] } },
      select: { key: true, value: true },
    })

    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }

    // Cache for 60 seconds — payment details rarely change mid-session
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch {
    // Return empty object on error — pending page falls back to defaults
    return NextResponse.json({})
  }
}