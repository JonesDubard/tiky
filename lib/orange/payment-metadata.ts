/** Persist Orange decline reasons on Payment.metadata (JSON string). */

export function appendOrangeFailureMetadata(
  existing: string | null | undefined,
  message: string | null
): string {
  let base: Record<string, unknown> = {}
  if (existing) {
    try {
      const parsed: unknown = JSON.parse(existing)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        base = parsed as Record<string, unknown>
      }
    } catch {
      /* keep empty base */
    }
  }
  base.orangeFailureMessage =
    message?.trim() || "Payment was declined by Orange Money."
  base.orangeFailureAt = new Date().toISOString()
  return JSON.stringify(base)
}

export function readOrangeFailureMessage(
  metadata: string | null | undefined
): string | null {
  if (!metadata) return null
  try {
    const parsed = JSON.parse(metadata) as { orangeFailureMessage?: string }
    const msg = parsed.orangeFailureMessage?.trim()
    return msg || null
  } catch {
    return null
  }
}
