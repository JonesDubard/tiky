// lib/payment/types.ts

export type PaymentMethod = "card" | "mtn_momo" | "orange_money";

export interface PaymentRequest {
  eventId: string;
  quantities: Record<string, number>; // ✅ replaces qty
  email?: string;                      // required for card
  phoneNumber?: string;                // required for MTN MoMo + Orange Money
  paymentMethod: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  clientSecret?: string;   // ✅ Stripe card payment
  redirectUrl?: string;    // ✅ MTN MoMo + Orange Money
  referenceId?: string;    // ✅ Mobile money transaction reference
  orderId?: string;        // ✅ all processors
  paymentId?: string;      // ✅ all processors
  error?: string;
}