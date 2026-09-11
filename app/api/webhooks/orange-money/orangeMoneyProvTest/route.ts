import { NextRequest, NextResponse } from "next/server"
import {
  orangeUnauthorizedResponse,
  verifyOrangeCallbackAuth,
} from "lib/orange/callback-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Orange Developer subscription probe.
 * Orange POSTs here with no body and expects:
 * - missing Authorization → 401
 * - invalid Authorization → 401
 * - valid Authorization → 200
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
    console.warn(`[ORANGE PROV TEST] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  return NextResponse.json({ status: "OK" }, { status: 200 })
}
