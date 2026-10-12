# Orange API Integration Guide

**Owner:** Dubardstudio  
**Status:** Living playbook  
**Reference implementation:** Tiky (`tikylr.com`) — Orange Money Business API, Debit, Liberia sandbox path  
**Source of truth:** Orange Developer, *Orange Money Business API (1.0) — Getting started*, plus the Tiky code under `lib/orange/` and the payment/webhook routes named in this guide.

## How to update this doc

Update this file when Orange changes a portal field, callback path, or error meaning, and when a Dubardstudio project integrates another Orange API. Do not add endpoints, parameters, KYC documents, or error codes that are not in the Getting Started PDF or in the project that proved them. If a value is market-specific or was only observed once, record it as **Confirm with Orange** and add a row to the [Lessons learned log](#lessons-learned-log).

This guide is the studio standard learned from the Liberia Orange Money debit integration. It does not claim a signed Orange partnership.

---

## 1. Executive Summary & Partnership Overview

Orange publishes partner APIs on the [Orange Developer](https://developer.orange.com) portal. The product Tiky integrated is **Orange Money Business API** (partner documentation version 1.0), specifically **Debit** (merchant payment): money moves from the customer’s Orange Money account to the partner’s Orange Money account.

The partner base path in the Getting Started PDF is:

`https://api.orange.com/om_partner_api/v1`

The country code is the next path segment. Sandbox is country `sx` and currency `OUV` (a fictional sandbox currency). The PDF lists Liberia as country `lr`, with currency **Liberian dollar or US dollar** (`LRD` / `USD`). Tiky production sends `ORANGE_COUNTRY=lr` and `ORANGE_CURRENCY=USD`. Orange confirmed on 12 October 2026 that production amounts may have at most two decimal places. Do not copy sandbox `OUV` into production.

The PDF’s async model, which Tiky follows:

1. The partner `POST`s a debit.
2. Orange returns **HTTP 202** with status `PENDING`. (Tiky also accepts HTTP 200 on that response.)
3. The customer validates on the phone when Orange requires it.
4. Orange `POST`s the partner callback with `SUCCESS` or `FAILED`.

**Dubardstudio approach, as built on Tiky:**

- Mirror the existing mobile-money checkout: create a pending order and payment, call the provider, then fulfill from the callback (with a read-only status check as fallback).
- Keep **OAuth** (calling Orange) separate from **callback Basic auth** (Orange calling us).
- Register an **HTTPS callback base URL**. Orange appends the paths. This app’s rewrites live at the site root, so the registered URL is the origin only.
- Treat the synchronous 202 as **pending**. Issue tickets or votes only when the outcome is `SUCCESS` (or `SUCCESSFUL`). On `FAILED`, store Orange’s message and do not fulfill.

Other Orange Money services in the same PDF — Credit, Withdraw, and DirectDebit — are not implemented here. See [Not in this playbook yet](#not-in-this-playbook-yet).

---

## 2. Prerequisites & Account Setup

### 2.1 Portal application

1. On [developer.orange.com](https://developer.orange.com), open **My apps** and create an application. The app name is a label only (Tiky’s example label: `TIKY_LIBERIA`).
2. Add the API **Orange Money Business API**.
3. From the application page, record the **Client ID** and **Client Secret**.

The **Authorization header on the app page** is the OAuth credential:

`Basic ` + Base64(`clientId:clientSecret`)

Store that entire header value in `ORANGE_OAUTH_BASIC`. If the value you copy does not already start with `Basic `, the Tiky client adds that prefix. If the portal stops showing the header, rebuild it from the Client ID and Client Secret. This value is the OAuth client credential. The callback password is a different secret (section 2.2).

Never commit `.env`, `.env.local`, or host dashboards that contain these values. Use placeholders in tickets and in this file.

### 2.2 Subscription form (separate from the app credential)

Subscribing the app to Orange Money Business API is a second step. The Getting Started PDF lists three fields on that form:

| Subscription field | What Tiky puts there |
| --- | --- |
| **OMContractRef** | The contract reference from the Orange contact. Sandbox and production use different contracts. This value is **not** a field on the debit JSON body. |
| **Callback URL** | HTTPS base URL only. Orange appends the paths below. |
| **Authorization header** | Basic auth that **our** callback server expects: `Basic ` + Base64(`callbackUser:callbackPassword`). Store the two parts as `ORANGE_CALLBACK_USER` and `ORANGE_CALLBACK_PASS`. |

The PDF states that the callback URL and the subscription Authorization header **cannot be changed after subscription**. Changing them means removing the API from the app and subscribing again. Wait for Orange’s activation confirmation before calling the API. A subscription that is not active yet surfaces as error code **10** (section 6).

**Callback URL rules for this codebase**

Next.js rewrites in `next.config.mjs` expose the handlers at the **site root**:

| Orange appends | Public URL | App route |
| --- | --- | --- |
| `/notifications` | `https://<host>/notifications` | `app/api/webhooks/orange-money/route.ts` |
| `/orangeMoneyProvTest` | `https://<host>/orangeMoneyProvTest` | `app/api/webhooks/orange-money/orangeMoneyProvTest/route.ts` |
| `/mandates/activation/notifications` | `https://<host>/mandates/activation/notifications` | `app/api/webhooks/orange-money/mandates/activation/notifications/route.ts` |

Because those rewrites have no path prefix, the value entered on the subscription form is the HTTPS origin, for example `https://www.tikylr.com`. Do not append `/notifications`. Do not include an explicit `:443`.

The PDF’s own example allows a path prefix (`https://partner.example.com/path/to` receives notifications at `.../path/to/notifications` and probes at `.../path/to/orangeMoneyProvTest`). A future app may use a prefix only if its server actually listens on `{prefix}/notifications`, `{prefix}/orangeMoneyProvTest`, and `{prefix}/mandates/activation/notifications`.

The Getting Started PDF documents `/notifications` and `/orangeMoneyProvTest` by name. This codebase also serves `/mandates/activation/notifications` because the Tiky subscription probes required that path. **Confirm with Orange** if a later portal version adds further callback paths.

**Confirm with Orange:** the Tiky subscription was filled with an origin-only HTTPS URL and was treated as having a 255-character field limit. That character limit is not stated in the Getting Started PDF. Re-check the live form before assuming the limit.

### 2.3 Sandbox versus production base URL

Pattern:

`https://api.orange.com/om_partner_api/v1/{country}`

| | Sandbox | Liberia production |
| --- | --- | --- |
| Country segment | `sx` | `lr` |
| Currency on the wire | `OUV` | `USD` on the Tiky contract. The PDF also allows `LRD`. Driven by `ORANGE_CURRENCY`. |
| Where it runs | The PDF says sandbox `sx` exists on the **production** platform, not on pre-production country test beds. | After a separate production subscription and activation. |

`lib/orange/client.ts` resolves the country segment **once**. If `ORANGE_BASE_URL` already ends in `/sx` and `ORANGE_COUNTRY` is `sx`, the client does not append `sx` again. A doubled path (`.../v1/sx/sx/debit`) was a real Tiky defect; the resolver also collapses a trailing duplicate segment. Set the env vars so a human can read them, and let the resolver keep a single country segment.

### 2.4 What we actually collected (KYC / contract)

Orange asks for commercial and compliance information on the subscription / contractualization path. This integration used only:

- An Orange Developer application (name label, Client ID, Client Secret)
- OAuth Basic rebuilt as `ORANGE_OAUTH_BASIC`
- Callback base URL
- Callback Basic user and password (`ORANGE_CALLBACK_USER`, `ORANGE_CALLBACK_PASS`)
- `OMContractRef` (sandbox contract for tests; a production contract is a separate request)

**Confirm with Orange on the subscription form** for any other compliance items (documents, company legal name, sandbox company-name suffix). The PDF does say to suffix the sandbox company name with `_SANDBOX` (example shape: `MyCompany_SANDBOX`). Do not treat that sentence as a full KYC checklist.

---

## 3. Authentication & Security Architecture

Two independent credentials. Mixing them is the most common setup failure.

| | Calling Orange | Orange calling us |
| --- | --- | --- |
| Scheme | OAuth 2.0 `client_credentials` | HTTP Basic |
| Secret | Client ID + Client Secret, sent as `ORANGE_OAUTH_BASIC` | `ORANGE_CALLBACK_USER` + `ORANGE_CALLBACK_PASS` |
| Where it is entered | App page on Orange Developer | Subscription form Authorization header |
| How it is sent later | `Authorization: Bearer <access_token>` on `/debit` and status | `Authorization: Basic <base64>` on our callback routes |

Debit callbacks in this integration use that Basic check. The Getting Started PDF does not describe an HMAC or body signature for these callbacks. Do not add a signature scheme unless a future Orange document specifies one.

### 3.1 OAuth2 client credentials

`POST https://api.orange.com/oauth/v3/token`

(The client reads `ORANGE_OAUTH_URL` when set. The default is the URL above.)

Headers:

- `Authorization`: the value of `ORANGE_OAUTH_BASIC` (prefix `Basic ` if it is missing)
- `Content-Type: application/x-www-form-urlencoded`
- `Accept: application/json`

Body: `grant_type=client_credentials`

The PDF’s token response contains `token_type` (`Bearer`), `access_token`, and `expires_in` (documented as 3600 seconds, one hour). It does **not** include a refresh token. When the token expires, request a new one with the same `client_credentials` call. The PDF’s phrase “refresh your token via `POST /oauth/v3/token`” means that re-fetch. There is no `refresh_token` grant in this playbook.

Tiky caches the bearer token in process memory and reuses it until 60 seconds before `expires_in`. If `expires_in` is absent, the client assumes 3600 seconds. API calls send `Authorization: Bearer <access_token>`. They do not send `ORANGE_OAUTH_BASIC`.

#### Node.js (matches `lib/orange/client.ts`)

```javascript
const OAUTH_URL =
  process.env.ORANGE_OAUTH_URL ?? "https://api.orange.com/oauth/v3/token";

function oauthAuthorizationHeader() {
  const raw = (process.env.ORANGE_OAUTH_BASIC ?? "").trim();
  if (!raw) throw new Error("ORANGE_OAUTH_BASIC is not configured");
  return raw.toLowerCase().startsWith("basic ") ? raw : `Basic ${raw}`;
}

let cachedToken = null;
let tokenExpiresAt = 0;

async function getBearerToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: oauthAuthorizationHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Orange token fetch failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  return cachedToken;
}

async function postDebit({ baseUrl, transactionId, peerId, amount, currency }) {
  const token = await getBearerToken();
  const res = await fetch(`${baseUrl}/debit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      peerId,
      peerIdType: "msisdn",
      amount,
      currency,
      transactionId,
    }),
  });

  // 202 + PENDING is the documented sync result. Tiky also accepts HTTP 200.
  if (res.status !== 202 && res.status !== 200) {
    throw new Error(`Orange debit failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}
```

Rebuild a missing portal header:

```javascript
const header =
  "Basic " + Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
// Store `header` in ORANGE_OAUTH_BASIC. Do not log it.
```

#### curl

```bash
curl -sS -X POST "https://api.orange.com/oauth/v3/token" \
  -H "Authorization: ${ORANGE_OAUTH_BASIC}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept: application/json" \
  -d "grant_type=client_credentials"
```

`ORANGE_OAUTH_BASIC` must already include the `Basic ` prefix in this curl example. On Windows PowerShell, `curl` is an alias of `Invoke-WebRequest` and quoting often corrupts the Authorization header. Call `curl.exe`, or run the command from a shell that does not alias `curl`.

#### Python (same token call)

```python
import os
import requests

header = os.environ["ORANGE_OAUTH_BASIC"].strip()
if not header.lower().startswith("basic "):
    header = f"Basic {header}"

response = requests.post(
    os.environ.get("ORANGE_OAUTH_URL", "https://api.orange.com/oauth/v3/token"),
    headers={
        "Authorization": header,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    },
    data={"grant_type": "client_credentials"},
    timeout=30,
)
response.raise_for_status()
access_token = response.json()["access_token"]
```

### 3.2 Callback Basic auth (strict compare)

`lib/orange/callback-auth.ts` accepts the header only when the Base64 token is **exactly** Base64(`ORANGE_CALLBACK_USER:ORANGE_CALLBACK_PASS`) in UTF-8.

- Missing `Authorization` → `401` with `WWW-Authenticate: Basic realm="Orange Money Callback"`.
- Wrong scheme, non-Base64 token, or any other token → `401`.
- A trailing character such as `%` fails the Base64 pattern check. Orange’s fake-auth probe appends `%`. A lenient Base64 decoder would accept that junk; this compare does not.
- Equal-length mismatch uses a constant-time compare. A length mismatch is rejected.
- If `ORANGE_CALLBACK_USER` or `ORANGE_CALLBACK_PASS` is unset, the route returns **500** (`misconfigured`), not 401. Fix the env before asking Orange to probe.

The subscription form wants the same pair encoded as one header: `Basic ` + Base64(`callbackUser:callbackPassword`).

### 3.3 Environment variables

| Variable | Required | Purpose | Safe placeholder / default |
| --- | --- | --- | --- |
| `ORANGE_OAUTH_BASIC` | Yes | OAuth Basic for `POST /oauth/v3/token`. Full `Basic …` header, or the bare Base64 token. | `Basic <base64(clientId:clientSecret)>` |
| `ORANGE_OAUTH_URL` | No | Token URL override. | `https://api.orange.com/oauth/v3/token` |
| `ORANGE_CALLBACK_USER` | Yes | Callback Basic username. | `callback-user` |
| `ORANGE_CALLBACK_PASS` | Yes | Callback Basic password. | `callback-password` |
| `ORANGE_BASE_URL` | No | Partner API origin + path up to the version, usually including the country once. | `https://api.orange.com/om_partner_api/v1/sx` |
| `ORANGE_COUNTRY` | No | Country segment. Must appear once in the final debit URL. | `sx` (production Liberia: `lr`) |
| `ORANGE_CURRENCY` | No | Currency on the **debit JSON**. | `OUV` (production: confirm with Orange) |

Set these in the host’s secret store (for this codebase, the Vercel project environment). Do not commit `.env` or `.env.local`.

`ORANGE_CURRENCY` is the Orange wire currency. Tiky’s checkout also writes `currency: "USD"` on the internal `Payment` row in `app/api/payment/initiate-orange/route.ts`. That column is the app’s ledger value. It is not the Orange debit currency.

---

## 4. Core Integration Workflows

### Not in this playbook yet

Do not implement the following from this document:

- **SMS, USSD, and Web Payment** as products. The Getting Started PDF mentions USSD/SMS only as the channel where a real customer may confirm a debit with a PIN. Tiky does not call an SMS, USSD, or Web Payment API.
- **Credit** (`POST /{country}/credit`), **Withdraw** (`POST /{country}/withdraw`), and **DirectDebit** (mandate init, debit, mandate status). They are in the Orange PDF. They are not implemented in Tiky. The mandate route in this repo only acknowledges subscription probes and logs a body if one arrives. When a project integrates one of those APIs, add a section from that project’s code and the PDF. Do not paste speculative request bodies in the meantime.

### 4.1 Debit (implemented)

**Endpoint:** `POST {ORANGE base}/{country}/debit`  
Sandbox example: `POST https://api.orange.com/om_partner_api/v1/sx/debit`

**Auth:** `Authorization: Bearer <access_token>`

**JSON body** (the only fields Tiky sends):

| Field | Value in Tiky |
| --- | --- |
| `peerId` | National MSISDN from `toOrangePeerId` (rules below). |
| `peerIdType` | `"msisdn"` |
| `amount` | Number. See amount rules. |
| `currency` | `ORANGE_CURRENCY` (`getOrangeCurrency()`). |
| `transactionId` | UUID from `crypto.randomUUID()`, stored as `Payment.providerRef` before the call. |

`posId` is **not** sent. The PDF says Orange may return `transactionData.posId` and that partners should ignore it. Tiky does not read it.

`OMContractRef` is **not** in this JSON. It is the subscription contract.

Example body (sandbox wallet issued to Tiky):

```json
{
  "peerId": "7704100030",
  "peerIdType": "msisdn",
  "amount": 1,
  "currency": "OUV",
  "transactionId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Synchronous result:** HTTP **202** and `status: "PENDING"` is the documented happy path. Tiky treats HTTP 200 the same way, then rejects a JSON `status` that is present and is neither `PENDING` nor `SUCCESS`. Any other HTTP status throws; checkout then marks the order and payment `FAILED` and cancels reserved tickets. The PDF rule matches that: if you never received 202, the transaction was not created — do not poll it; fix the request and submit a **new** `transactionId`.

The PDF also says a duplicate `transactionId` is rejected. Generate a new UUID per attempt. Tiky stores that UUID before calling Orange (`initiate-orange` and the vote initiate route).

Checkout and vote purchase both call `initiateDebit` (`app/api/payment/initiate-orange/route.ts`, `app/api/poll-votes/initiate/route.ts`).

#### peerId

`toOrangePeerId` in `lib/orange/client.ts` takes the raw phone and the country. Production routes pass the phone only, so `ORANGE_COUNTRY` selects the rule. `normalisePhone` (the MTN helper) is used for the phone stored on the ticket. It can drop a digit. The debit `peerId` is `toOrangePeerId(phoneNumber)` on the **raw** input, not the MTN-normalised value.

**Liberia production (`lr`).** Orange stated on 12 October 2026: locally they use **10 digits leading with `0`**, written `07XXXXXXXX`. Do not strip that `0`. Do not send country code `231`.

| Typed at checkout | `peerId` sent |
| --- | --- |
| `0773295060` | `0773295060` |
| `773295060` | `0773295060` |
| `231773295060` or `+231773295060` | `0773295060` |

Sending the 9-digit form is what made Orange return HTTP 400, code 24, `The customer account is unknown.` Observed on 9 October 2026: `772674122` (request id `opapccballrt12-190249-302701-1`) and `773295060` (request id `opapccballrt02-996270-8509998-2`). Both numbers were registered Orange Money wallets. After the formatter kept the leading `0`, the same wallet was accepted: 12 October 2026 10:54:50 UTC, `POST https://api.orange.com/om_partner_api/v1/lr/debit`, `peerId` `0773295060`, amount `0.25` USD, order `cmv54xtpm0002fodkdjm45e0e`, log line `debit sent` (HTTP 202).

The OMLR parent `0779948113` and child `0779948108` are merchant wallets. They are not the only number a production debit may charge. A live debit uses the customer’s own Orange Money number, in the 10-digit `07…` form, and that customer approves with their own PIN.

**Sandbox (`sx`).** Keep the wallet Orange issued. `7704100030` stays 10 digits with no added trunk `0`. `07704100030` becomes `7704100030`. Do not apply the Liberia leading-`0` rule to sandbox.

#### Amount

The PDF says sandbox `sx` / `OUV` accepts **integers only**. Tiky’s `formatOrangeDebitAmount`:

- When country is `sx` and currency is `OUV`: round to a whole number and enforce a **minimum of 1**. `0.05` was rejected as an invalid amount.
- Otherwise: round to 2 decimal places (`Math.round(n * 100) / 100`).

Orange confirmed for this Liberia production contract: amounts may have **at most two decimal digits**. `0.25` USD was accepted on the 12 October 2026 debit. Do not apply the sandbox minimum of 1 to `lr` / `USD`.

Checkout passes the order total through `amount.toFixed(2)` and then through `formatOrangeDebitAmount`. On sandbox `sx`/`OUV`, a fractional ticket price becomes a whole OUV amount of at least 1. The internal order total is unchanged.

#### PIN and the sandbox customer

PIN is **not** a checkout field. Tiky never sends a PIN to Orange.

The PDF’s customer journey for a live debit is: push notification (USSD or SMS), customer sees amount and partner name, customer enters their Orange Money PIN, confirmation SMS. Documented customer window: `serviceTimeout` **300000 ms (5 minutes)**, after which Orange sends `FAILED`.

The same PDF’s sandbox chapter says there is **no real user interaction**: no SMS and no USSD prompt. Transactions are auto-processed or stay pending depending on the MSISDN. The PDF’s sample auto-accept MSISDN is `7704100023` with PIN `1357`. A different PIN on that sample number is described as staying `PENDING`. That sample number is **not** the wallet Orange issued for the Tiky tests.

For the Tiky sandbox wallet **`7704100030`**, Orange said the virtual customer does not confirm. Observed result (Sep 2026): the debit stayed pending for about **23 minutes**, then the callback was `FAILED` with message `Echec de l'opération, le délai de validation a été atteint.` The PDF’s 5-minute `serviceTimeout` and the ~23-minute observation are both recorded here. **Confirm with Orange** why that wallet’s validation deadline was longer than 300000 ms. Do not “fix” the integration to match 5 minutes by cancelling the payment locally.

Checkout copy asks the customer to approve with their own Orange Money PIN. It does not mention sandbox PIN `1357`.

### 4.2 Status (read-only fallback)

`GET {base}/debit/transactions/{transactionId}`

Same Bearer token. Tiky maps the JSON `status`:

| Orange `status` | Tiky `OrangeTxnStatus` |
| --- | --- |
| `SUCCESS`, `SUCCESSFUL` | `SUCCESS` |
| `FAILED`, `FAIL` | `FAILED` |
| anything else, including missing | `PENDING` |

`txnId` is read from `transactionData.txnId` or top-level `txnId`. `message` is passed through.

HTTP **404** from this GET is mapped in the client to `FAILED` with message `Transaction not found on Orange Money`. The PDF says a 404 means the transaction does not exist: do not retry that `transactionId`; create a new one. The PDF’s resilience chapter also says to use this GET when no callback has arrived after 5 minutes, or when the original POST had no HTTP response at all. Do not poll after a definite 4xx/5xx on the original POST (other than the “no response at all” case, where the GET tells you whether Orange stored it).

`app/api/payment/status/route.ts` calls this GET for `paymentMethod === "orange_money"`. It is a fallback reader. Fulfillment still happens on `SUCCESS`. A provider `FAILED` is ignored for the first **15 seconds** of the order (`ORANGE_FAIL_GRACE_MS`) so a racing webhook can land first; after that the route stores the failure message and marks the order failed. That grace window is a Tiky choice, not an Orange timeout.

### 4.3 Callbacks

Orange POSTs to `{callback base}/notifications` with the subscription Basic header and a JSON body. The PDF requires **HTTP 200** to acknowledge, including when `status` is `FAILED`. Tiky’s notification handler returns `200` with `{ "received": true }` for success, failure, unknown status, a missing `transactionId`, and an already-final payment. Returning 200 on `FAILED` is acknowledgement, not fulfillment.

**Fulfill only when `status` is `SUCCESS` or `SUCCESSFUL`.**

- Vote metadata (`type: "vote"`): create the votes and mark the payment `COMPLETED`, storing `txnId` as `externalId` when present.
- Ticket order: `issueTicketsForOrder`, then mark the payment `COMPLETED`.
- `FAILED` or `FAIL`: persist `message` on payment metadata (`orangeFailureMessage`, `orangeFailureAt`), mark the payment `FAILED`, mark the order `FAILED`, and cancel reserved tickets. Do not issue tickets or votes.
- A second callback after `COMPLETED` or `FAILED` is acknowledged and ignored.

The notification route also accepts `PUT` (same handler as `POST`). The PDF specifies `POST`.

**Subscription probes** (PDF), all sent to `{callback base}/orangeMoneyProvTest`, without a body:

| Probe | Expected |
| --- | --- |
| No `Authorization` | HTTP 401 or 403. Tiky returns **401**. |
| Fake `Authorization` (including a valid token with a trailing `%`) | HTTP 401 or 403. Tiky returns **401**. |
| Valid Basic | HTTP **200**. |

Tiky’s prov-test route returns `{ "status": "OK" }` on a valid empty (or non-test) body. If the JSON body has `action: "test"` (case-insensitive), it returns `{ "status": "ok", "action": "test" }`. The mandate path uses the same auth rules and the same 200 probe bodies. It does not fulfill payments.

Probes must pass **before** you subscribe. The PDF runs the same three checks in sandbox and in production. If any check fails, subscription fails.

### 4.4 Do not let the browser poll cancel Orange

The checkout pending page (`app/(public)/checkout/pending/page.tsx`) polls `GET /api/payment/status` every 5 seconds and stops after **60 attempts (about 5 minutes)**. The UI then shows **“Confirmation timed out…”** and a failed page state. That timeout only stops the browser poll. It does not call Orange, and it does not mark the payment failed by itself.

The status route’s separate 5-minute shortcut applies only when `paymentMethod` is **not** `orange_money`. Orange orders stay `PENDING` in our database until a callback or a later status read says `SUCCESS` or `FAILED`.

The vote UI stops its own poll sooner (3 minutes) and toasts a MoMo-worded timeout. That toast also does not cancel the Orange debit.

Orange sandbox on `7704100030` can stay pending for about 23 minutes. A 5-minute screen message is not a provider result. Keep the order pending, and keep the callback handler alive, until Orange sends `SUCCESS` or `FAILED`.

---

## 5. Testing, Sandbox & Go-Live Checklist

### 5.1 Proven sandbox path (Tiky, Sep 2026)

This run is a successful test of the **unhappy path**, not a bug:

| Item | Observed value |
| --- | --- |
| Request | `POST …/v1/sx/debit` |
| `peerId` | `7704100030` (10 digits, as issued) |
| `amount` / `currency` | `1` / `OUV` |
| Sync response | HTTP **202**, pending |
| Later callback | `FAILED` after about 23 minutes |
| `message` | `Echec de l'opération, le délai de validation a été atteint.` |
| Orange `txnId` | `MP260922.1723.A00685` |

Orange’s explanation: the virtual customer on `7704100030` does not confirm. **Do not keep retesting `7704100030` expecting `SUCCESS`.**

**Still open:** one `SUCCESS` callback so ticket/vote fulfillment is proven end to end. Ask Orange how that virtual customer confirms, or ask for an auto-approve MSISDN. The PDF documents `7704100023` with PIN `1357` as an auto-accept sandbox number. Confirm that Orange has **issued that number to this application** before anyone uses it. It was not the wallet used in the Sep 2026 Tiky run.

### 5.2 Portal probes before subscribe

With production-like HTTPS and the callback env vars set:

1. `POST /orangeMoneyProvTest` with no Authorization → **401** (JSON), not an HTML error page.
2. `POST /orangeMoneyProvTest` with a fake Basic value, including a trailing `%` → **401**.
3. `POST /orangeMoneyProvTest` with Base64 of `ORANGE_CALLBACK_USER:ORANGE_CALLBACK_PASS` → **200**.
4. Repeat the valid-auth check for `/notifications` and `/mandates/activation/notifications`.

Then subscribe. The PDF will not activate a subscription whose probes fail.

### 5.3 Suggested sandbox sequence

1. Callback routes deployed and the three probes passing.
2. Sandbox `OMContractRef` and the test MSISDN from Orange (Tiky’s was `7704100030`).
3. App subscribed to Orange Money Business API and **activated**.
4. `ORANGE_COUNTRY=sx`, `ORANGE_CURRENCY=OUV`, base URL with a single `sx`.
5. One debit of amount `1`. Confirm HTTP 202.
6. Leave the order pending until the callback. On this wallet, expect `FAILED` and the validation-deadline message, and confirm the failure message is stored and nothing is fulfilled.
7. After Orange provides an auto-approve MSISDN, one debit that ends in `SUCCESS`, and confirm tickets or votes are issued exactly once.

### 5.4 Go-live checklist (Liberia)

Sandbox and production are separate subscriptions. Repeat subscription for production.

- [x] Production `OMContractRef` is entered on the Orange subscription form. It is **not** a debit JSON field. `ORANGE_OM_CONTRACT_REF` on the host only silences a startup warning and is stored on the local payment row. An empty value did not cause code 24.
- [x] Production OAuth uses the production app’s Client ID and Client Secret in `ORANGE_OAUTH_BASIC` (Tiky app: Future Group Int Production). Do not reuse the sandbox app’s OAuth header.
- [x] Callback Basic stays the pair that passed subscription (`ORANGE_CALLBACK_USER` / `ORANGE_CALLBACK_PASS`). Do not replace it with the OAuth client id and secret.
- [x] `ORANGE_COUNTRY=lr`. `ORANGE_BASE_URL` may be `https://api.orange.com/om_partner_api/v1` with no country; the client appends `lr` once. Final debit URL: `https://api.orange.com/om_partner_api/v1/lr/debit`.
- [x] `ORANGE_CURRENCY=USD` for the Tiky contract. The PDF also allows `LRD`. Do not leave `OUV` in production.
- [x] Liberia `peerId` is 10 digits leading with `0` (`07XXXXXXXX`). Confirmed by Orange on 12 October 2026.
- [x] Production amounts may have at most two decimal digits. Confirmed by Orange on 12 October 2026. `0.25` USD was accepted.
- [x] Callback base URL is HTTPS on the production domain, no path. Probes passed and the production subscription was activated (Credit and Debit).
- [x] First accepted production debit: 12 October 2026 10:54:50 UTC, `peerId` `0773295060`, amount `0.25` USD, order `cmv54xtpm0002fodkdjm45e0e`, HTTP 202.
- [ ] After the customer approves the PIN, confirm one `SUCCESS` callback and that tickets are issued once.
- [ ] Callback handler stays up. Browser poll timeouts must not cancel or fail the provider payment.
- [ ] Secrets only in the host env. No `.env` in git.

**Reference deploy target for this codebase only:** Vercel team `cindy3`, project `tiky`, domain `https://www.tikylr.com`. Callback base URL shape: `https://www.tikylr.com`.

---

## 6. Troubleshooting & Maintenance

### 6.1 Lessons from the Tiky integration

| What happened | What to do |
| --- | --- |
| Subscription Authorization was a short or unrelated Basic value | Put Base64(`ORANGE_CALLBACK_USER:ORANGE_CALLBACK_PASS`) on the **subscription** form. Put Base64(`clientId:clientSecret`) in `ORANGE_OAUTH_BASIC`. |
| Mandate probe path missing | Serve `POST /mandates/activation/notifications` with the same Basic checks. Tiky rewrites it in `next.config.mjs`. |
| PowerShell `curl` mangled the header | Use `curl.exe` or a shell without the `curl` alias. See section 3.1. |
| Debit URL contained `/sx/sx/` | One country segment only. `resolveOrangeCountryBaseUrl` collapses a trailing duplicate. |
| Probe returned an **nginx HTML 403** | The request never reached the Next.js route (which returns JSON 401 or 200). Check the edge in front of the app before debugging Orange credentials. |
| Generic `FAILED` versus invalid amount | `0.05` OUV on `sx` was rejected. Sandbox amount is a whole number, minimum 1. A `FAILED` callback message is the provider reason; store it (`orangeFailureMessage`) instead of replacing it with a generic string. |
| `peerId` shortened on sandbox | `7704100030` must stay 10 digits. Do not apply that sandbox rule to Liberia. |
| Liberia `peerId` missing the leading `0` | Orange looks up `07XXXXXXXX` (10 digits). `773295060` returned code 24. Send `0773295060`. |
| `ORANGE_OM_CONTRACT_REF` unset | Startup warning only. The debit body does not include `OMContractRef`. Setting the env var does not fix code 24. |
| HTTP 403 code 10 | Subscription exists and is not active yet. Wait for Orange. Do not change the debit body. |
| UI “Confirmation timed out” while Orange was still pending | The 5-minute page poll is not a cancel. Sandbox on this wallet ran ~23 minutes. |
| App-page Authorization header disappeared | Rebuild `ORANGE_OAUTH_BASIC` from Client ID and Client Secret. |
| One Basic used for both hops | OAuth Basic and callback Basic are different secrets. |

### 6.2 Error codes (Getting Started PDF only)

Transaction codes from the PDF:

| Code | PDF short description | PDF guidance |
| --- | --- | --- |
| 10 | Service subscribed but not yet active | Wait for activation. Do not retry. |
| 23 | Missing or invalid body or body field | Check fields and format constraints. |
| 30 | Transaction technical error | Amount is not a valid multiple of the currency unit, currency does not match the country, or an internal processing error. The PDF says some countries reject decimals. |
| 51 | Forbidden requester | App / `OMContractRef` mapping is wrong, or the contract is not on this service. |
| 70 | Not authorized to process this transaction | That service is not on the contract. Contact Orange. |

HTTP codes from the PDF:

| HTTP | PDF meaning |
| --- | --- |
| 200 | Status query succeeded, or (in the PDF) a DirectDebit transaction completed. |
| 201 | Mandate created (sandbox), in the PDF. Not used by Tiky debit. |
| 202 | Accepted, `PENDING`. Wait for the callback. |
| 401 | OAuth token invalid or expired. Request a new token with `client_credentials`. |
| 404 | Transaction or mandate does not exist. Do not reuse that id. |
| 429 | Rate limit exceeded; the transaction was **not** created. Back off and retry later with a new attempt. The PDF does not publish a numeric quota. Do not invent one. Do not status-poll a 429 debit. |

PDF operating rules worth keeping next to the codes:

- No 202 on debit → not created → do not poll that id.
- 404 on status → not created → new `transactionId` if you still need to charge.
- Duplicate `transactionId` → rejected.

Tiky’s callback **401** is our Basic check, not Orange’s OAuth 401. Read the URL before treating them as the same failure.

Observed on the Tiky Liberia production debit, not listed in the PDF table above:

| Code | HTTP | What Orange returned | What it meant |
| --- | --- | --- | --- |
| 10 | 403 | The Service is subscribed but it is not yet active. | Wait for the activation email. Request id `opapccballrt06-772599-8274484-4` on 9 October 2026. |
| 24 | 400 | Invalid body field. The customer account is unknown. | `peerId` was 9 digits. Liberia production requires 10 digits starting with `0`. |

### 6.3 FAQ

**Which Basic header goes where?**  
App-page header → `ORANGE_OAUTH_BASIC` → token request only. Subscription Authorization → `ORANGE_CALLBACK_USER` / `ORANGE_CALLBACK_PASS` → callback routes only.

**Why is debit 202 and the order still pending?**  
202 means Orange accepted the debit. Fulfillment waits for `SUCCESS`. On wallet `7704100030`, `SUCCESS` does not arrive.

**The pending page says confirmation timed out. Is the payment cancelled?**  
No. The checkout poll stopped at about 5 minutes. Orange may still send a callback. The status API can be read with the same `transactionId`. Do not start a second debit for that same id.

**Should we send the PIN, or `posId`, or `OMContractRef` on debit?**  
No. PIN is not a debit field in this integration. `posId` is returned by Orange and ignored. `OMContractRef` is subscription-only.

**Sandbox currency in production?**  
No. Production Liberia is country `lr`. The Tiky contract uses `USD`. Orange allows at most two decimal digits on that amount. Sandbox `OUV` stays a whole number, minimum 1.

**Why did a real Orange Money number return “customer account is unknown”?**  
Code 24. The wallet was real, and the `peerId` was 9 digits because the leading `0` had been removed. Liberia production wants `07XXXXXXXX`.

**Did we sign an Orange partnership by using this guide?**  
No. This is Dubardstudio’s implementation playbook from the Tiky Liberia debit integration.

**Where are SMS, USSD, Web Payment, credit, and cash-out?**  
Not implemented. Section 4, “Not in this playbook yet.”

### 6.4 Lessons learned log

Add a row when a portal field, MSISDN rule, timeout, or error message surprises a project. Leave the template rows empty until then.

| Date | Project | Lesson |
| --- | --- | --- |
| 2026-09 | Tiky (Liberia, sandbox `sx`) | OAuth Basic (`ORANGE_OAUTH_BASIC`) and callback Basic (`ORANGE_CALLBACK_USER` / `ORANGE_CALLBACK_PASS`) are different credentials. A short or swapped Basic on the subscription form fails the portal probes. |
| 2026-09 | Tiky | Subscription probes need `/orangeMoneyProvTest`, `/notifications`, and `/mandates/activation/notifications` on the HTTPS origin. Missing mandate path fails subscribe. Valid Basic → 200; missing or fake (including trailing `%`) → 401. An nginx HTML 403 means the probe never hit the app. |
| 2026-09 | Tiky | Debit URL must contain the country once (`…/v1/sx/debit`). `…/v1/sx/sx/debit` was a defect. |
| 2026-09 | Tiky | `peerId` `7704100030` stays 10 digits. Amount on `sx`/`OUV` is a whole number, minimum 1. `0.05` was an invalid amount. |
| 2026-09 | Tiky | Debit HTTP 202, then ~23 min later callback `FAILED`, message `Echec de l'opération, le délai de validation a été atteint.`, `txnId` `MP260922.1723.A00685`. Virtual customer does not confirm. This is a successful unhappy-path test. `SUCCESS` fulfillment is still unproven. |
| 2026-09 | Tiky | Checkout “Confirmation timed out” (~5 min) does not cancel the Orange payment. Do not apply the MTN 5-minute status shortcut to `orange_money`. |
| 2026-09 | Tiky | If the app page hides the Authorization header, rebuild `Basic` + Base64(`clientId:clientSecret`). PowerShell `curl` quoting can corrupt that header during manual tests. |
| 2026-10 | Tiky (Liberia, production `lr`) | Orange activated Credit and Debit on a separate production app. OAuth Basic comes from that app. Callback Basic stays the subscription pair. Error 10 means subscribed but not active. |
| 2026-10 | Tiky | Liberia `peerId` is 10 digits leading with `0` (`07XXXXXXXX`). Amounts may have at most two decimals. `0.25` USD with `peerId` `0773295060` returned HTTP 202 (order `cmv54xtpm0002fodkdjm45e0e`). Nine-digit `peerId` values returned code 24. `OMContractRef` stays on the subscription form. |
|  |  |  |
|  |  |  |
