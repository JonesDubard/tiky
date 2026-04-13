// lib/manual-payment.ts
// Core utilities for the manual payment system.
// All ticket issuance logic lives here so it can be called from
// both the admin approval route and future webhook integrations.

import { prisma } from "lib/prisma"
import QRCode from "qrcode"
import crypto from "crypto"

// ─── Reference Code ──────────────────────────────────────────────────────────

/**
 * Generates a unique, human-readable payment reference.
 * Format: TK-XXXXXX (6 uppercase alphanumeric chars)
 * Users write this on their MoMo/bank transfer memo.
 */
export function generateReferenceCode(): string {
  // Use crypto for true randomness — avoids Math.random() collisions
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O, 1/I confusion
  const bytes = crypto.randomBytes(6)
  const code = Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("")
  return `TK-${code}`
}

/**
 * Ensures the generated reference code is unique in the DB.
 * Retries up to 5 times (astronomically unlikely to collide).
 */
export async function generateUniqueReferenceCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferenceCode()
    const existing = await prisma.order.findFirst({
      where: { referenceCode: code },
      select: { id: true },
    })
    if (!existing) return code
  }
  // Fallback: timestamp-based (guaranteed unique)
  return `TK-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export type ManualPaymentMethod = "mtn_momo" | "orange_money" | "bank_transfer"

export interface PaymentInstructions {
  method: ManualPaymentMethod
  label: string
  accountNumber: string
  accountName: string
  bankName?: string
  instructions: string[]
}

/**
 * Returns the payment instructions for each method.
 * Update these with your actual account details.
 */
export function getPaymentInstructions(
  method: ManualPaymentMethod,
  amount: number,
  referenceCode: string
): PaymentInstructions {
  const amountStr = `$${amount.toFixed(2)} USD`

  const methodMap: Record<ManualPaymentMethod, PaymentInstructions> = {
    mtn_momo: {
      method: "mtn_momo",
      label: "MTN Mobile Money",
      accountNumber: process.env.MTN_MOMO_NUMBER ?? "+231 88 000 0000",
      accountName: process.env.MTN_MOMO_NAME ?? "Tiky Events",
      instructions: [
        `Dial *156#`,
        `Select "Send Money" → "To MoMo Number"`,
        `Enter number: ${process.env.MTN_MOMO_NUMBER ?? "+231 88 000 0000"}`,
        `Enter amount: ${amountStr}`,
        `In the reference/memo field, type: ${referenceCode}`,
        `Complete the transfer and screenshot the confirmation`,
        `Upload the screenshot below`,
      ],
    },
    orange_money: {
      method: "orange_money",
      label: "Orange Money",
      accountNumber: process.env.ORANGE_MONEY_NUMBER ?? "+231 77 000 0000",
      accountName: process.env.ORANGE_MONEY_NAME ?? "Tiky Events",
      instructions: [
        `Dial #144# or open Orange Money app`,
        `Select "Send Money"`,
        `Enter number: ${process.env.ORANGE_MONEY_NUMBER ?? "+231 77 000 0000"}`,
        `Enter amount: ${amountStr}`,
        `Enter reference: ${referenceCode}`,
        `Confirm and screenshot your receipt`,
        `Upload the screenshot below`,
      ],
    },
    bank_transfer: {
      method: "bank_transfer",
      label: "Bank Transfer",
      accountNumber: process.env.BANK_ACCOUNT_NUMBER ?? "1234567890",
      accountName: process.env.BANK_ACCOUNT_NAME ?? "Tiky Events LLC",
      bankName: process.env.BANK_NAME ?? "Ecobank Liberia",
      instructions: [
        `Transfer to: ${process.env.BANK_NAME ?? "Ecobank Liberia"}`,
        `Account name: ${process.env.BANK_ACCOUNT_NAME ?? "Tiky Events LLC"}`,
        `Account number: ${process.env.BANK_ACCOUNT_NUMBER ?? "1234567890"}`,
        `Amount: ${amountStr}`,
        `Reference/Narration: ${referenceCode} (REQUIRED)`,
        `Take a photo of your bank receipt or teller slip`,
        `Upload the photo below`,
      ],
    },
  }

  return methodMap[method]
}

// ─── Ticket Issuance ──────────────────────────────────────────────────────────

export interface IssueTicketsResult {
  success: boolean
  ticketCount: number
  error?: string
}

/**
 * Issues tickets for an approved order.
 * Called by the admin approve endpoint.
 * Idempotent — safe to call multiple times (checks existing status).
 */
export async function issueTicketsForOrder(
  orderId: string
): Promise<IssueTicketsResult> {
  // Fetch the order with its reserved tickets
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tickets: true,
      payments: { select: { id: true } },
    },
  })

  if (!order) {
    return { success: false, ticketCount: 0, error: "Order not found" }
  }

  // Idempotency: if already completed, skip
  if (order.status === "COMPLETED") {
    return { success: true, ticketCount: order.tickets.length }
  }

  const reservedTickets = order.tickets.filter((t) => t.status === "RESERVED")

  if (reservedTickets.length === 0) {
    return { success: false, ticketCount: 0, error: "No reserved tickets found" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Generate QR image for each reserved ticket and mark as PAID
      for (const ticket of reservedTickets) {
        const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
          width: 400,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        })

        await tx.ticketInstance.update({
          where: { id: ticket.id },
          data: {
            status: "PAID",
            qrImage: qrDataUrl,
          },
        })
      }

      // 2. Mark order as COMPLETED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          ticketGenerated: true,
        },
      })

      // 3. Mark payment as COMPLETED
      if (order.payments.length > 0) {
        await tx.payment.updateMany({
          where: { orderId },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        })
      }
    })

    return { success: true, ticketCount: reservedTickets.length }
  } catch (error) {
    console.error("issueTicketsForOrder failed:", error)
    return {
      success: false,
      ticketCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

/**
 * Generates a wa.me deep link for ticket delivery notification.
 * The admin can click this to notify the user their ticket is ready.
 */
export function buildWhatsAppLink(params: {
  phone: string
  eventTitle: string
  referenceCode: string
  ticketViewUrl: string
}): string {
  const { phone, eventTitle, referenceCode, ticketViewUrl } = params

  // Strip non-digits, ensure country code
  const cleanPhone = phone.replace(/\D/g, "")

  const message = [
    `✅ *Your Tiky ticket is confirmed!*`,
    ``,
    `*Event:* ${eventTitle}`,
    `*Reference:* ${referenceCode}`,
    ``,
    `View your QR ticket here:`,
    ticketViewUrl,
    ``,
    `Show this QR code at the entrance. See you there! 🎉`,
  ].join("\n")

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Builds a WhatsApp rejection message for the admin to send.
 */
export function buildWhatsAppRejectionLink(params: {
  phone: string
  referenceCode: string
  reason?: string
}): string {
  const { phone, referenceCode, reason } = params
  const cleanPhone = phone.replace(/\D/g, "")

  const message = [
    `❌ *Payment not confirmed — Ref: ${referenceCode}*`,
    ``,
    reason
      ? `Reason: ${reason}`
      : `We could not verify your payment. Please check your transfer and try again.`,
    ``,
    `Contact support or resubmit your proof at: ${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending/${referenceCode}`,
  ].join("\n")

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}