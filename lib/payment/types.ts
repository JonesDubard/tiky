// lib/payment/types.ts

export type PaymentMethod = "card" | "mtn_momo" | "orange_money";
import Stripe from "stripe";


export interface PaymentRequest {
  eventId: string;
  quantities: Record<string, number>; // ✅ replaces qty
  email?: string;                      // required for card
  phoneNumber?: string;                // required for MTN MoMo + Orange Money
  paymentMethod: PaymentMethod;
}

export interface PaymentResult {
  success: boolean;
  clientSecret?: string; // ✅ Stripe card payment
  paymentIntent?: Stripe.PaymentIntent;  // ✅ Stripe full payment intent object
  redirectUrl?: string;    // ✅ MTN MoMo + Orange Money
  referenceId?: string;    // ✅ Mobile money transaction reference
  orderId?: string;        // ✅ all processors
  paymentId?: string;      // ✅ all processors
  error?: string;
}
