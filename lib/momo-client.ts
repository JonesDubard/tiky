import axios from "axios"
import { v4 as uuidv4 } from "uuid"

const baseURL = process.env.MOMO_BASE_URL!

let cachedToken: string | null = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const credentials = Buffer.from(
    `${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`
  ).toString("base64")

  const response = await axios.post(
    `${baseURL}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Ocp-Apim-Subscription-Key":
          process.env.MOMO_SUBSCRIPTION_KEY!,
      },
    }
  )

  cachedToken = response.data.access_token
  tokenExpiry = Date.now() + 50 * 60 * 1000

  return cachedToken
}

export async function requestToPay({
  amount,
  currency,
  phone,
  externalId,
}: {
  amount: number
  currency: string
  phone: string
  externalId: string
}) {
  const token = await getAccessToken()
  const referenceId = uuidv4()

  await axios.post(
    `${baseURL}/collection/v1_0/requesttopay`,
    {
      amount: amount.toString(),
      currency,
      externalId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phone,
      },
      payerMessage: "Event Ticket Payment",
      payeeNote: "Ticket Purchase",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": "sandbox",
        "Ocp-Apim-Subscription-Key":
          process.env.MOMO_SUBSCRIPTION_KEY!,
      },
    }
  )

  return referenceId
}
