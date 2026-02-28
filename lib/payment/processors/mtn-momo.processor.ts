import { prisma } from "lib/prisma"
import { PaymentRequest, PaymentResult } from "lib/payment/types"
import { v4 as uuidv4 } from "uuid"
import { generateTicketsForOrder } from "lib/tickets/generate"

const MTN_BASE_URL = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com"
const MTN_SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY!
const MTN_API_USER = process.env.MOMO_API_USER!
const MTN_API_KEY = process.env.MOMO_API_KEY!
const MTN_TARGET_ENV = process.env.MOMO_TARGET_ENVIRONMENT || "sandbox"
const CALLBACK_URL = process.env.MOMO_CALLBACK_URL!

async function getMTNAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString("base64")

  console.log("MTN Auth - API_USER:", MTN_API_USER)
  console.log("MTN Auth - Subscription Key:", MTN_SUBSCRIPTION_KEY?.slice(0, 8) + "...")
  console.log("MTN Auth - Base64 credentials length:", credentials.length)

  const res = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
    },
  })

  console.log("MTN token response status:", res.status)
  const responseText = await res.text()
  console.log("MTN token response body:", responseText)

  if (!res.ok) {
    throw new Error(`MTN token error: ${responseText}`)
  }

  const data = JSON.parse(responseText)
  console.log("MTN token obtained successfully, expires in:", data.expires_in)
  return data.access_token
}

export class MTNMoMoProcessor {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const { eventId, quantities, phoneNumber } = request

      if (!phoneNumber) {
        return { success: false, error: "Phone number required for MTN MoMo" }
      }

      const ticketTypeIds = Object.keys(quantities)
      if (ticketTypeIds.length === 0) {
        return { success: false, error: "No tickets selected" }
      }

      const ticketTypes = await prisma.ticketType.findMany({
        where: { id: { in: ticketTypeIds }, eventId },
      })

      if (ticketTypes.length === 0) {
        return { success: false, error: "Ticket types not found" }
      }

      const totalAmount = ticketTypes.reduce((sum, t) => {
        return sum + t.price * (quantities[t.id] || 0)
      }, 0)

      if (totalAmount <= 0) {
        return { success: false, error: "Invalid total amount" }
      }

      const order = await prisma.order.create({
        data: { totalPrice: totalAmount, status: "PENDING" },
      })

      const payment = await prisma.payment.create({
        data: {
          amount: totalAmount,
          currency: "EUR",
          status: "PENDING",
          paymentMethod: "mtn_momo",
          orderId: order.id,
          eventId,
        },
      })

      const accessToken = await getMTNAccessToken()
      const referenceId = uuidv4()

      const requestBody = {
        amount: totalAmount.toFixed(2),
        currency: "EUR",
        externalId: order.id,
        payer: {
          partyIdType: "MSISDN",
          partyId: phoneNumber.replace(/\D/g, ""),
        },
        payerMessage: "Ticket purchase",
        payeeNote: `Order ${order.id}`,
      }

      console.log("MTN requesttopay payload:", JSON.stringify(requestBody, null, 2))
      console.log("MTN requesttopay referenceId:", referenceId)
      console.log("MTN requesttopay target env:", MTN_TARGET_ENV)
      console.log("MTN requesttopay callback:", CALLBACK_URL)

      const momoRes = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": MTN_TARGET_ENV,
          "X-Callback-Url": CALLBACK_URL,
          "Ocp-Apim-Subscription-Key": MTN_SUBSCRIPTION_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!momoRes.ok) {
        const errText = await momoRes.text()
        const errStatus = momoRes.status
        console.error(`MTN requesttopay failed [${errStatus}]:`, errText || "(empty body)")
        console.error("MTN response headers:", Object.fromEntries(momoRes.headers.entries()))
        return { success: false, error: "Failed to initiate MTN MoMo payment" }
      }

      // ✅ Save referenceId first
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerRef: referenceId },
      })

      // ✅ Then generate tickets as a separate await — sandbox only, remove in production
      
     await generateTicketsForOrder(order.id, quantities)

      return {
        success: true,
        redirectUrl: `/checkout/success?orderId=${order.id}&status=pending&method=mtn_momo`,
        orderId: order.id,
        paymentId: payment.id,
        referenceId,
      }
    } catch (error: any) {
      console.error("MTNMoMoProcessor error:", error)
      return { success: false, error: error.message }
    }
  }
}