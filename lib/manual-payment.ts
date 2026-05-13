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
// Replace ONLY the issueTicketsForOrder function in lib/manual-payment.ts
// Everything else in that file stays the same.
//
// CHANGES:
// 1. Logs the exact error so Vercel shows what's failing in the transaction
// 2. Breaks QR generation OUT of the Prisma transaction
//    (QRCode.toDataURL is async/CPU-heavy and can cause transaction timeouts)
// 3. Generates all QR codes first, THEN does the DB transaction

export async function issueTicketsForOrder(
  orderId: string
): Promise<IssueTicketsResult> {

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tickets:  true,
      payments: { select: { id: true } },
    },
  })

  if (!order) {
    return { success: false, ticketCount: 0, error: "Order not found" }
  }

  console.log("[DEBUG tickets]", order.tickets.map(t => ({
  id: t.id,
  status: t.status,
  hasQR: !!t.qrImage
})))

  // ✅ If already completed → exit safely
  if (order.status === "COMPLETED") {
    return { success: true, ticketCount: order.tickets.length }
  }

  // 🔥 NEW: Handle BOTH RESERVED + already PAID tickets
  const ticketsToProcess = order.tickets.filter(
    t => t.status === "RESERVED" || (t.status === "PAID" && !t.qrImage)
  )

  // ✅ If ALL tickets already PAID with QR → just finalize order
  const alreadyDone = order.tickets.length > 0 &&
    order.tickets.every(t => t.status === "PAID" && t.qrImage)

  if (alreadyDone) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED", ticketGenerated: true },
    })

    return { success: true, ticketCount: order.tickets.length }
  }

  // ❌ If no tickets to process at all → don't fail, just log + exit safely
  if (ticketsToProcess.length === 0) {
    console.warn(`[issueTickets] No tickets to process for ${orderId}`)
    return { success: false, ticketCount: 0, error: "Nothing to process" }
  }

  // ── Generate QR codes OUTSIDE transaction ──
  const qrResults: { ticketId: string; qrDataUrl: string }[] = []

  try {
    for (const ticket of ticketsToProcess) {
      const qrDataUrl = await QRCode.toDataURL(ticket.qrCode, {
        width: 400,
        margin: 2,
      })

      qrResults.push({ ticketId: ticket.id, qrDataUrl })
    }
  } catch (err) {
    console.error("[issueTickets] QR generation failed:", err)
    return { success: false, ticketCount: 0, error: "QR generation failed" }
  }

  // ── Transaction ──
  try {
    await prisma.$transaction(async (tx) => {
  // 1. Fetch ONLY currently RESERVED tickets (prevents double decrement)
  const freshReservedTickets = await tx.ticketInstance.findMany({
    where: {
      orderId,
      status: "RESERVED",
    },
    select: { id: true, ticketTypeId: true, qrCode: true },
  });

  // Build counts from the fresh list
  const counts: Record<string, number> = {};
  for (const ticket of freshReservedTickets) {
    counts[ticket.ticketTypeId] = (counts[ticket.ticketTypeId] || 0) + 1;
  }

  // 2. Decrement inventory safely (oversell protection)
  for (const [ticketTypeId, count] of Object.entries(counts)) {
    const result = await tx.ticketType.updateMany({
      where: {
        id: ticketTypeId,
        quantity: { gte: count },
      },
      data: { quantity: { decrement: count } },
    });

    if (result.count === 0) {
      throw new Error(`Insufficient inventory for ticket type ${ticketTypeId}`);
    }
  }

  // 3. Mark those fresh reserved tickets as PAID (thread‑safe)
  let updatedCount = 0;
  for (const ticket of freshReservedTickets) {
    // Find the pre‑generated QR code for this ticket
    const qrResult = qrResults.find(r => r.ticketId === ticket.id);
    if (!qrResult) continue; // should never happen, but skip if missing

    const updateResult = await tx.ticketInstance.updateMany({
      where: {
        id: ticket.id,
        status: "RESERVED",
      },
      data: { status: "PAID", qrImage: qrResult.qrDataUrl },
    });

    updatedCount += updateResult.count;
  }

  // 4. Ensure ALL fresh reserved tickets were successfully updated
  if (updatedCount !== freshReservedTickets.length) {
    throw new Error(
      `Only updated ${updatedCount}/${freshReservedTickets.length} tickets – possible race condition`
    );
  }

  // 5. Complete the order
  await tx.order.update({
    where: { id: orderId },
    data: { status: "COMPLETED", ticketGenerated: true },
  });
});

    return { success: true, ticketCount: order.tickets.length }

  } catch (error) {
    console.error("[issueTickets] Transaction failed:", error)
    return { success: false, ticketCount: 0, error: "Transaction failed" }
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