import assert from "node:assert/strict"
import {
  appendOrangeFailureMetadata,
  readOrangeFailureMessage,
} from "../lib/orange/payment-metadata.ts"

const merged = appendOrangeFailureMetadata(
  JSON.stringify({ type: "ticket" }),
  "Insufficient balance"
)
assert.equal(readOrangeFailureMessage(merged), "Insufficient balance")

console.log("orange-payment-metadata.test.mjs: ok")
