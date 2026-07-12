// app/api/webhooks/orange-money/route.ts
//
// Orange Money Business API notification endpoint.
// Required for Orange Developer Portal subscription validation:
//   POST with valid Basic Auth     → 200
//   POST without Authorization     → 401
//   POST with invalid Authorization → 401
//   Body {"action":"test"}         → 200 JSON (subscription probe)
//
// Payment fulfillment is intentionally NOT implemented yet.

import { NextRequest, NextResponse } from "next/server"
import {
  orangeUnauthorizedResponse,
  verifyOrangeCallbackAuth,
} from "lib/orange/callback-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function handleOrangeCallback(req: NextRequest) {
  const authResult = verifyOrangeCallbackAuth(req.headers.get("authorization"))

  if (authResult === "misconfigured") {
    return NextResponse.json(
      { error: "Callback credentials are not configured" },
      { status: 500 }
    )
  }

  if (authResult === "missing" || authResult === "invalid") {
    console.warn(`[ORANGE CALLBACK] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  const body = await req.json().catch(() => ({}))
  console.log("[ORANGE CALLBACK] Received:", JSON.stringify(body))

  // Orange Developer Portal subscription compliance probe
  if (body?.action === "test") {
    return NextResponse.json({ status: "ok", action: "test" })
  }

  // Acknowledge other notifications without processing payments yet.
  // Full debit SUCCESS/FAILED handling comes after OAuth credentials are available.
  return NextResponse.json({ received: true })
}

export async function POST(req: NextRequest) {
  try {
    return await handleOrangeCallback(req)
  } catch (err) {
    console.error("[ORANGE CALLBACK] Unhandled error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Orange docs describe POST; accept PUT as a defensive alias.
export const PUT = POST
