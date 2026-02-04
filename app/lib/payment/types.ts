// app/lib/payment/types.ts
export interface PaymentRequest {
  eventId: string
  userId?: string
  guestEmail?: string
  guestName?: string
  phoneNumber?: string
  email?: string
  fullName?: string
  quantity?: number
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  ticketId?: string
  error?: string
  redirectUrl?: string
  requiresRedirect?: boolean
  providerData?: Record<string, any>
}

export interface PaymentProcessor {
  processPayment(request: PaymentRequest): Promise<PaymentResult>
  verifyPayment(transactionId: string): Promise<PaymentResult>
  handleWebhook(data: any): Promise<boolean>
}