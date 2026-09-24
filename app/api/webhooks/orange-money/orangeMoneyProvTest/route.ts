import { NextRequest, NextResponse } from "next/server"
import {
  orangeUnauthorizedResponse,
  verifyOrangeCallbackAuth,
} from "lib/orange/callback-auth"
import {
  isOrangeTestProbe,
  orangeProbeOkResponse,
  orangeTestProbeResponse,
  parseOrangeCallbackBody,
} from "lib/orange/callback-probe"

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
    console.error(
      "[ORANGE PROV TEST] Rejected: ORANGE_CALLBACK_USER/PASS are not set"
    )
    return NextResponse.json(
      { error: "Callback credentials are not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }

  if (authResult === "missing" || authResult === "invalid") {
    console.warn(`[ORANGE PROV TEST] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  const body = await parseOrangeCallbackBody(req)
  if (isOrangeTestProbe(body)) {
    return orangeTestProbeResponse()
  }

  return orangeProbeOkResponse()
}
