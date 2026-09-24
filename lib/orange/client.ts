// lib/orange/client.ts
// Orange Money Business API — OAuth + Debit + status

const OAUTH_URL = (
  process.env.ORANGE_OAUTH_URL ?? "https://api.orange.com/oauth/v3/token"
).trim()

const OAUTH_BASIC = (process.env.ORANGE_OAUTH_BASIC ?? "").trim()
/** Root only. Country is appended so sandbox `/sx` cannot stick when COUNTRY is `lr`. */
const BASE_URL = (
  process.env.ORANGE_BASE_URL ?? "https://api.orange.com/om_partner_api/v1"
).trim().replace(/\/+$/, "")
const COUNTRY = (process.env.ORANGE_COUNTRY ?? "lr").trim()
/** Liberia accepts LRD or USD. Ticket prices in this app are USD. */
const CURRENCY = (process.env.ORANGE_CURRENCY ?? "USD").trim()
/**
 * Production contract from OMLR. Entered on the Orange Developer subscription
 * form. The Debit API does not accept this field in the request body.
 */
const CONTRACT_REF = (process.env.ORANGE_OM_CONTRACT_REF ?? "").trim()

/**
 * Resolve …/om_partner_api/v1/{country} exactly once.
 * Replaces a leftover sandbox segment (`/sx`) when the target country differs,
 * and collapses duplicate segments such as `/sx/sx`.
 */
export function resolveOrangeCountryBaseUrl(
  baseUrl: string,
  country: string
): string {
  const c = country.trim()
  if (!c) return baseUrl.trim().replace(/\/+$/, "")

  const cLower = c.toLowerCase()
  let u: URL
  try {
    u = new URL(baseUrl.trim())
  } catch {
    const base = baseUrl.trim().replace(/\/+$/, "")
    if (base.toLowerCase().endsWith(`/${cLower}`)) return base
    return `${base}/${c}`
  }

  const segments = u.pathname.split("/").filter(Boolean)

  while (
    segments.length >= 2 &&
    segments[segments.length - 1].toLowerCase() ===
      segments[segments.length - 2].toLowerCase()
  ) {
    segments.pop()
  }

  const last = segments[segments.length - 1]?.toLowerCase() ?? ""
  if (last === cLower) {
    // already …/v1/{country}
  } else if (/^[a-z]{2}$/.test(last)) {
    segments[segments.length - 1] = c
  } else {
    segments.push(c)
  }

  u.pathname = `/${segments.join("/")}`
  return `${u.origin}${u.pathname}`.replace(/\/+$/, "")
}

function countryBaseUrl(): string {
  return resolveOrangeCountryBaseUrl(BASE_URL, COUNTRY)
}

if (!OAUTH_BASIC) {
  console.warn(
    "[Orange] Missing ORANGE_OAUTH_BASIC — debit payments will fail until the production app credentials are set."
  )
}

if (!CONTRACT_REF) {
  console.warn(
    "[Orange] Missing ORANGE_OM_CONTRACT_REF — subscribe the production app with the OMLR contract before the first debit."
  )
}

console.info(
  `[Orange] POST ${countryBaseUrl()}/debit currency=${CURRENCY} contract=${CONTRACT_REF || "unset"}`
)

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
 * Orange Debit peerId is the national MSISDN, with no country code.
 * Keep every national digit: 7704100030 stays 10 digits. Strip one leading 0,
 * or country code 231. A number typed as 9 digits stays 9 — do not add a 0.
 * Pass the raw phone. normalisePhone drops this 10th digit for MTN.
 */
export function toOrangePeerId(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "")

  // 231 + 9 national digits, or 231 + 10 national digits
  if (digits.startsWith("231") && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(3)
  }

  // 0770410003 → 770410003; 07704100030 → 7704100030
  if (digits.startsWith("0") && (digits.length === 10 || digits.length === 11)) {
    return digits.slice(1)
  }

  return digits
}

/**
 * Orange Debit amount for the active country/currency.
 * Sandbox OUV accepts integers only. Production USD/LRD keep two decimals.
 */
export function formatOrangeDebitAmount(
  amount: number,
  currency: string = CURRENCY,
  country: string = COUNTRY
): number {
  const parsed = Number.isFinite(amount) ? amount : 0
  if (currency.toUpperCase() === "OUV" && country.toLowerCase() === "sx") {
    const whole = Math.round(parsed)
    return Math.max(1, whole)
  }
  return Math.round(parsed * 100) / 100
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
  const countryBase = countryBaseUrl()
  const url = `${countryBase}/debit`

  const body = {
    peerId: params.peerId,
    peerIdType: "msisdn",
    amount: formatOrangeDebitAmount(Number(params.amount)),
    currency,
    transactionId: params.transactionId,
  }

  console.log(
    `[ORANGE] debit POST ${url} peerId=${params.peerId} amount=${body.amount} ${currency}`
  )

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
    const requestId = res.headers.get("x-oapi-request-id")
    console.error(
      `[ORANGE DEBIT ERROR] ${res.status} POST ${url} requestId=${requestId ?? "n/a"} —`,
      errBody
    )
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
  const url = `${countryBaseUrl()}/debit/transactions/${transactionId}`

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

export function getOrangeContractRef(): string {
  return CONTRACT_REF
}

export function getOrangeCountryBaseForDebug(): string {
  return countryBaseUrl()
}
