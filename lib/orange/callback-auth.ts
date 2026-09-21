import { timingSafeEqual } from "crypto"

const BASIC_AUTH_RE = /^Basic\s+(\S+)$/i
const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/

/**
 * Validates Orange Money Business API callback Basic Auth.
 * Orange subscription probes require:
 * - valid Authorization  → 200
 * - missing Authorization → 401/403
 * - invalid Authorization → 401/403
 *
 * Orange's fake-auth probe appends "%" to the Base64 token; Node's lenient
 * base64 decoder would accept that unless we compare the token exactly.
 */
export function verifyOrangeCallbackAuth(
  authorizationHeader: string | null
): "ok" | "missing" | "invalid" | "misconfigured" {
  const expectedUser = process.env.ORANGE_CALLBACK_USER?.trim()
  const expectedPass = process.env.ORANGE_CALLBACK_PASS?.trim()

  if (!expectedUser || !expectedPass) {
    console.error("[ORANGE CALLBACK] ORANGE_CALLBACK_USER/PASS are not set")
    return "misconfigured"
  }

  if (!authorizationHeader) {
    return "missing"
  }

  const trimmed = authorizationHeader.trim()
  const match = trimmed.match(BASIC_AUTH_RE)
  if (!match) {
    return "invalid"
  }

  const encoded = match[1]
  if (!BASE64_RE.test(encoded)) {
    return "invalid"
  }

  const expectedEncoded = Buffer.from(
    `${expectedUser}:${expectedPass}`,
    "utf8"
  ).toString("base64")

  if (!constantTimeEqual(encoded, expectedEncoded)) {
    return "invalid"
  }

  return "ok"
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    timingSafeEqual(aBuf, aBuf)
    return false
  }
  return timingSafeEqual(aBuf, bBuf)
}

export function orangeUnauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Orange Money Callback"',
      },
    }
  )
}
