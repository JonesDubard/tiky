import assert from "node:assert/strict"
import {
  formatOrangeDebitAmount,
  resolveOrangeCountryBaseUrl,
  toOrangePeerId,
} from "../lib/orange/client.ts"

const sandboxBase = "https://api.orange.com/om_partner_api/v1/sx"
assert.equal(
  resolveOrangeCountryBaseUrl(sandboxBase, "sx"),
  sandboxBase
)
assert.equal(
  resolveOrangeCountryBaseUrl(sandboxBase, "sx") + "/debit",
  "https://api.orange.com/om_partner_api/v1/sx/debit"
)

const prodRoot = "https://api.orange.com/om_partner_api/v1"
assert.equal(
  resolveOrangeCountryBaseUrl(prodRoot, "lr"),
  "https://api.orange.com/om_partner_api/v1/lr"
)

// Misconfigured env with duplicate country segment
assert.equal(
  resolveOrangeCountryBaseUrl(
    "https://api.orange.com/om_partner_api/v1/sx/sx",
    "sx"
  ),
  "https://api.orange.com/om_partner_api/v1/sx"
)

// Trailing newline on base URL (common Vercel paste issue)
assert.equal(
  resolveOrangeCountryBaseUrl(
    "https://api.orange.com/om_partner_api/v1/sx\n",
    "sx"
  ),
  sandboxBase
)

assert.equal(toOrangePeerId("231770410003"), "770410003")
assert.equal(toOrangePeerId("0770410003"), "770410003")
assert.equal(toOrangePeerId("770410003"), "770410003")
assert.equal(toOrangePeerId("7704100030"), "770410003")
assert.equal(toOrangePeerId("07704100030"), "770410003")

assert.equal(formatOrangeDebitAmount(0.05), 1)
assert.equal(formatOrangeDebitAmount(10.55), 11)

console.log("orange-url.test.mjs: ok")
