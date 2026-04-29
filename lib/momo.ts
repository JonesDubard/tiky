// lib/momo.ts


const BASE_URL         = process.env.MOMO_BASE_URL         ?? "https://proxy.momoapi.mtn.com"
const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY ?? ""
const API_USER_ID      = process.env.MOMO_API_USER_ID      ?? ""
const API_KEY          = process.env.MOMO_API_KEY          ?? ""
const ENVIRONMENT      = process.env.MOMO_ENV              ?? "mtnliberia"
const CALLBACK_URL     = process.env.MOMO_CALLBACK_URL     ?? ""

if (!SUBSCRIPTION_KEY || !API_USER_ID || !API_KEY) {
  console.warn("[MoMo] Missing env vars — payments will fail until MOMO_* vars are set.")
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getBearerToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken
  const credentials = Buffer.from(`${API_USER_ID}:${API_KEY}`).toString("base64")
  const res = await fetch(`${BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      "Authorization":             `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`MoMo token fetch failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  cachedToken    = data.access_token as string
  tokenExpiresAt = Date.now() + ((data.expires_in as number) ?? 3600) * 1000
  return cachedToken
}

export interface RequestToPayParams {
  referenceId:  string
  amount:       string
  currency:     string
  partyId:      string
  payerMessage: string
  payeeNote:    string
}

export async function requestToPay(params: RequestToPayParams): Promise<void> {
  const token = await getBearerToken()
  const headers: Record<string, string> = {
    "Authorization":             `Bearer ${token}`,
    "X-Reference-Id":            params.referenceId,
    "X-Target-Environment":      ENVIRONMENT,
    "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    "Content-Type":              "application/json",
  }
  if (CALLBACK_URL) headers["X-Callback-Url"] = CALLBACK_URL
  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      amount:       params.amount,
      currency:     params.currency,
      externalId:   params.referenceId,
      payer:        { partyIdType: "MSISDN", partyId: params.partyId },
      payerMessage: params.payerMessage,
      payeeNote:    params.payeeNote,
    }),
  })
  if (res.status !== 202) {
  const errBody = await res.text()
  const fullMessage = `MoMo requesttopay failed (${res.status}): ${errBody}`
  console.error('[MOMO REQUESTTOPAY ERROR]', fullMessage)
  throw new Error(fullMessage)
}
}

export type MoMoStatus = "PENDING" | "SUCCESSFUL" | "FAILED"

export interface PaymentStatusResult {
  status:                 MoMoStatus
  financialTransactionId: string | null
  reason:                 string | null
}

export async function getPaymentStatus(referenceId: string): Promise<PaymentStatusResult> {
  const token = await getBearerToken()
  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      "Authorization":             `Bearer ${token}`,
      "X-Target-Environment":      ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
    },
  })
  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`MoMo status check failed (${res.status}): ${errBody}`)
  }
  const data = await res.json()
  return {
    status:                 (data.status as MoMoStatus) ?? "PENDING",
    financialTransactionId: data.financialTransactionId ?? null,
    reason:                 data.reason ?? null,
  }
}

export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("231") && digits.length === 12) return digits
  if (digits.startsWith("0")   && digits.length === 10) return `231${digits.slice(1)}`
  if (digits.length === 9)                               return `231${digits}`
  return null
}