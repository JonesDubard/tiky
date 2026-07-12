import { timingSafeEqual } from "crypto"

/**
 * Validates Orange Money Business API callback Basic Auth.
 * Orange subscription probes require:
 * - valid Authorization  → 200
 * - missing Authorization → 401/403
 * - invalid Authorization → 401/403
 */
export function verifyOrangeCallbackAuth(
  authorizationHeader: string | null
): "ok" | "missing" | "invalid" | "misconfigured" {
  const expectedUser = process.env.ORANGE_CALLBACK_USER
  const expectedPass = process.env.ORANGE_CALLBACK_PASS

  if (!expectedUser || !expectedPass) {
    console.error("[ORANGE CALLBACK] ORANGE_CALLBACK_USER/PASS are not set")
    return "misconfigured"
  }

  if (!authorizationHeader) {
    return "missing"
  }

  const [scheme, encoded] = authorizationHeader.split(" ")
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) {
    return "invalid"
  }

  let decoded: string
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8")
  } catch {
    return "invalid"
  }

  const colon = decoded.indexOf(":")
  if (colon < 0) {
    return "invalid"
  }

  const user = decoded.slice(0, colon)
  const pass = decoded.slice(colon + 1)

  if (!constantTimeEqual(user, expectedUser) || !constantTimeEqual(pass, expectedPass)) {
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
