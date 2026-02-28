import crypto from "crypto"

export function verifyWebhookSignature(
  payload: string,
  signature: string
) {
  const expected = crypto
    .createHmac("sha256", process.env.MOMO_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex")

  return expected === signature
}
