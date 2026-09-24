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
 * Orange Money DirectDebit mandate activation notifications.
 * Required for Developer portal subscription (probe + future mandate callbacks).
 */
export async function POST(req: NextRequest) {
  const authResult = verifyOrangeCallbackAuth(req.headers.get("authorization"))

  if (authResult === "misconfigured") {
    console.error(
      "[ORANGE MANDATE ACTIVATION] Rejected: ORANGE_CALLBACK_USER/PASS are not set"
    )
    return NextResponse.json(
      { error: "Callback credentials are not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }

  if (authResult === "missing" || authResult === "invalid") {
    console.warn(`[ORANGE MANDATE ACTIVATION] Auth ${authResult}`)
    return orangeUnauthorizedResponse()
  }

  const body = await parseOrangeCallbackBody(req)

  if (isOrangeTestProbe(body)) {
    return orangeTestProbeResponse()
  }

  if (Object.keys(body).length > 0) {
    const data = body.transactionData as { transactionId?: string } | undefined
    console.log(
      `[ORANGE MANDATE ACTIVATION] status=${String(body.status ?? "")} transactionId=${data?.transactionId ?? String(body.transactionId ?? "")}`
    )
  }

  return orangeProbeOkResponse()
}
