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

  const bodyObj = {
    amount:       params.amount,
    currency:     params.currency,
    externalId:   params.referenceId,
    payer:        { partyIdType: "MSISDN", partyId: params.partyId },
    payerMessage: params.payerMessage,
    payeeNote:    params.payeeNote,
  }

  //  console.log("[MOMO REQUEST BODY]", JSON.stringify(bodyObj, null, 2))
  // console.log("[MOMO REQUEST HEADERS]", JSON.stringify(headers, null, 2));
  // console.log("[MOMO URL]", `${BASE_URL}/collection/v1_0/requesttopay`);

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyObj),
  })

  //  console.log("[MOMO RESPONSE]", {
  //    status: res.status,
  //    headers: Object.fromEntries(res.headers.entries()),
  //    body: await res.text(),
  //  })

  if (res.status !== 202) {
    const errBody = await res.text()
    console.error(`[MOMO REQUESTTOPAY ERROR] ${res.status} — Body:`, errBody)
    throw new Error(`MoMo requesttopay failed (${res.status}): ${errBody}`)
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

  // Remove accidental leading 0 after country code (e.g., 2310881234567 → 231881234567)
  if (digits.startsWith("2310") && digits.length === 13) {
    return `231${digits.slice(4)}`
  }

  // Already correct international format (231 followed by 9 digits)
  if (digits.startsWith("231") && digits.length === 12) {
    return digits
  }

  // Liberian local format with leading 0 (e.g., 0881234567 → 231881234567)
  if ((digits.startsWith("077") || digits.startsWith("088")) && digits.length === 10) {
    return `231${digits.slice(1)}`
  }

  // Liberian format without leading 0 (e.g., 881234567 → 231881234567)
  if ((digits.startsWith("77") || digits.startsWith("88")) && digits.length === 9) {
    return `231${digits}`
  }

  // Generic fallback: if the number looks like a plausible MSISDN, try to normalize
  if (digits.length >= 9 && digits.length <= 13) {
    return digits
  }

  return null
}