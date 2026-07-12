// lib/orange/client.ts
// Orange Money Business API — OAuth + Debit + status

const OAUTH_URL =
  process.env.ORANGE_OAUTH_URL ?? "https://api.orange.com/oauth/v3/token"

const OAUTH_BASIC = (process.env.ORANGE_OAUTH_BASIC ?? "").trim()
const BASE_URL = (
  process.env.ORANGE_BASE_URL ?? "https://api.orange.com/om_partner_api/v1/sx"
).replace(/\/$/, "")
const COUNTRY = (process.env.ORANGE_COUNTRY ?? "sx").trim()
const CURRENCY = (process.env.ORANGE_CURRENCY ?? "OUV").trim()

if (!OAUTH_BASIC) {
  console.warn(
    "[Orange] Missing ORANGE_OAUTH_BASIC — debit payments will fail until set."
  )
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

function authHeaderValue(): string {
  if (!OAUTH_BASIC) {
    throw new Error("ORANGE_OAUTH_BASIC is not configured")
  }
  return OAUTH_BASIC.toLowerCase().startsWith("basic ")
    ? OAUTH_BASIC
    : `Basic ${OAUTH_BASIC}`
}

async function getBearerToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: authHeaderValue(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Orange token fetch failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  cachedToken = data.access_token as string
  tokenExpiresAt = Date.now() + ((data.expires_in as number) ?? 3600) * 1000
  return cachedToken
}

/**
 * Orange Debit examples use national MSISDN without country code
 * (e.g. 771234567). Convert from our 231… normalised form.
 */
export function toOrangePeerId(msisdn231: string): string {
  const digits = msisdn231.replace(/\D/g, "")
  if (digits.startsWith("231") && digits.length === 12) {
    return digits.slice(3)
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return digits.slice(1)
  }
  return digits
}

export interface OrangeDebitParams {
  transactionId: string
  amount: string
  peerId: string
  currency?: string
}

export async function initiateDebit(params: OrangeDebitParams): Promise<void> {
  const token = await getBearerToken()
  const currency = params.currency ?? CURRENCY
  const url = `${BASE_URL}/${COUNTRY}/debit`

  const body = {
    peerId: params.peerId,
    peerIdType: "msisdn",
    amount: Number(params.amount),
    currency,
    transactionId: params.transactionId,
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (res.status !== 202 && res.status !== 200) {
    const errBody = await res.text()
    console.error(`[ORANGE DEBIT ERROR] ${res.status} —`, errBody)
    throw new Error(`Orange debit failed (${res.status}): ${errBody}`)
  }

  // 202 + PENDING is the documented happy path; some sandboxes may return 200.
  const data = await res.json().catch(() => null)
  if (data?.status && data.status !== "PENDING" && data.status !== "SUCCESS") {
    throw new Error(
      `Orange debit unexpected status: ${data.status} ${data.message ?? ""}`
    )
  }
}

export type OrangeTxnStatus = "PENDING" | "SUCCESS" | "FAILED"

export interface OrangeStatusResult {
  status: OrangeTxnStatus
  txnId: string | null
  message: string | null
}

export async function getOrangePaymentStatus(
  transactionId: string
): Promise<OrangeStatusResult> {
  const token = await getBearerToken()
  const url = `${BASE_URL}/${COUNTRY}/debit/transactions/${transactionId}`

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (res.status === 404) {
    return {
      status: "FAILED",
      txnId: null,
      message: "Transaction not found on Orange Money",
    }
  }

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Orange status check failed (${res.status}): ${errBody}`)
  }

  const data = await res.json()
  const raw = String(data.status ?? "PENDING").toUpperCase()

  let status: OrangeTxnStatus = "PENDING"
  if (raw === "SUCCESS" || raw === "SUCCESSFUL") status = "SUCCESS"
  else if (raw === "FAILED" || raw === "FAIL") status = "FAILED"

  return {
    status,
    txnId: data.transactionData?.txnId ?? data.txnId ?? null,
    message: data.message ?? null,
  }
}

export function getOrangeCurrency(): string {
  return CURRENCY
}
