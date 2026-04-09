// app/api/admin/settings/route.ts
//
// REWRITTEN from scratch. Previous version used an in-memory `let settings`
// object that reset on every serverless cold start — saves were silently lost.
//
// This version persists settings to the DB using a key-value Setting model.
// On first GET, if no settings exist, seeds sensible defaults automatically.
//
// Settings covered:
// - Branding (site name, support email, timezone)
// - Payment accounts (MTN MoMo, Orange Money, bank transfer details)
// - Ticket confirmation message
// - Notifications (email, on-sale alert, new-user alert)
// - Platform (maintenance mode, currency)

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "lib/auth"
import { prisma } from "lib/prisma"

// ── All valid setting keys ────────────────────────────────────────────────────
// Using a const array as the source of truth prevents stray keys being saved.

export const SETTING_KEYS = [
  // Branding
  "siteName",
  "supportEmail",
  "timezone",
  // Payment accounts — previously only in .env, now admin-editable
  "mtnMomoNumber",
  "mtnMomoName",
  "orangeMoneyNumber",
  "orangeMoneyName",
  "bankName",
  "bankAccountNumber",
  "bankAccountName",
  "supportPhone",
  // Tickets
  "ticketConfirmationMessage",
  // Notifications
  "notifyEmail",
  "notifyOnTicketSale",
  "notifyOnNewUser",
  "notifyOnPendingPayment",
  // Platform
  "currency",
  "maintenanceMode",
] as const

export type SettingKey = (typeof SETTING_KEYS)[number]

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULTS: Record<SettingKey, string> = {
  siteName: "Tiky",
  supportEmail: "tikyliberia@gmail.com",
  timezone: "Africa/Monrovia",
  mtnMomoNumber: process.env.NEXT_PUBLIC_MTN_MOMO_NUMBER ?? "",
  mtnMomoName: process.env.NEXT_PUBLIC_MTN_MOMO_NAME ?? "Tiky Events",
  orangeMoneyNumber: process.env.NEXT_PUBLIC_ORANGE_MONEY_NUMBER ?? "",
  orangeMoneyName: process.env.NEXT_PUBLIC_ORANGE_MONEY_NAME ?? "Tiky Events",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "",
  bankAccountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "",
  bankAccountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "Tiky Events LLC",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "",
  ticketConfirmationMessage:
    "Thank you for your purchase! Your ticket is ready. See you at the event! 🎉",
  notifyEmail: "",
  notifyOnTicketSale: "true",
  notifyOnNewUser: "false",
  notifyOnPendingPayment: "true",
  currency: "USD",
  maintenanceMode: "false",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Convert flat DB rows to a typed settings object
function rowsToSettings(rows: { key: string; value: string }[]): Record<SettingKey, string> {
  const result = { ...DEFAULTS }
  for (const row of rows) {
    if (SETTING_KEYS.includes(row.key as SettingKey)) {
      result[row.key as SettingKey] = row.value
    }
  }
  return result
}

// Seed defaults if no settings exist yet (first run)
async function seedDefaults() {
  await prisma.setting.createMany({
    data: SETTING_KEYS.map((key) => ({ key, value: DEFAULTS[key] })),
    skipDuplicates: true,
  })
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rows = await prisma.setting.findMany({
      select: { key: true, value: true },
    })

    // Seed on first run
    if (rows.length === 0) {
      await seedDefaults()
      return NextResponse.json(DEFAULTS)
    }

    return NextResponse.json(rowsToSettings(rows))
  } catch (error) {
    console.error("[SETTINGS GET]", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    // Only accept known keys — reject unknown fields silently
    const updates: { key: string; value: string }[] = []

    for (const key of SETTING_KEYS) {
      if (key in body) {
        const raw = body[key]
        // Coerce booleans to string for storage
        const value =
          typeof raw === "boolean" ? String(raw) : String(raw ?? "").trim()
        updates.push({ key, value })
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid settings provided" }, { status: 400 })
    }

    // Upsert each key — update if exists, insert if not
    await Promise.all(
      updates.map((u) =>
        prisma.setting.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    )

    console.log(`[SETTINGS] ${session.user.email} saved ${updates.length} settings`)

    // Return the full updated settings object
    const rows = await prisma.setting.findMany({ select: { key: true, value: true } })
    return NextResponse.json(rowsToSettings(rows))
  } catch (error) {
    console.error("[SETTINGS POST]", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}