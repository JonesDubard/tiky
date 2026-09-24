import { NextRequest, NextResponse } from "next/server"

export type OrangeCallbackBody = Record<string, unknown>

/** Parse Orange callback JSON body (tolerant of missing Content-Type). */
export async function parseOrangeCallbackBody(
  req: NextRequest
): Promise<OrangeCallbackBody> {
  try {
    const text = await req.text()
    if (!text.trim()) {
      return {}
    }
    const parsed: unknown = JSON.parse(text)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as OrangeCallbackBody
    }
    return {}
  } catch {
    return {}
  }
}

export function isOrangeTestProbe(body: OrangeCallbackBody): boolean {
  return String(body.action ?? "").toLowerCase() === "test"
}

const NO_STORE = { "Cache-Control": "no-store" }

/** Orange Developer portal subscription probe response. */
export function orangeTestProbeResponse() {
  return NextResponse.json(
    { status: "ok", action: "test" },
    { status: 200, headers: NO_STORE }
  )
}

/** Generic auth-only probe response for paths without a transaction body. */
export function orangeProbeOkResponse() {
  return NextResponse.json(
    { status: "OK" },
    { status: 200, headers: NO_STORE }
  )
}
