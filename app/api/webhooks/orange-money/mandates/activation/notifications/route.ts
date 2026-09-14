import { NextRequest, NextResponse } from "next/server"
import {
  orangeUnauthorizedResponse,
  verifyOrangeCallbackAuth,
} from "lib/orange/callback-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Orange Money DirectDebit mandate activation notifications.
 * Required for Developer portal subscription (probe + future mandate callbacks).
 */
export async function POST(req: NextRequest) {
  const authResult = verifyOrangeCallbackAuth(req.headers.get("authorization"))

  if (authResult === "misconfigured") {
    return NextResponse.json(
      { error: "Callback credentials are not configured" },
      { status: 500 }
    )
  }

  if (authResult === "missing" || authResult === "invalid") {
    console.warn(`[ORANGE MANDATE ACTIVATION] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  const body = await req.json().catch(() => ({}))

  if (body?.action === "test") {
    return NextResponse.json({ status: "ok", action: "test" })
  }

  if (Object.keys(body).length > 0) {
    console.log(
      "[ORANGE MANDATE ACTIVATION] Received:",
      JSON.stringify(body)
    )
  }

  return NextResponse.json({ status: "OK" }, { status: 200 })
}
