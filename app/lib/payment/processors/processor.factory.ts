// app/lib/payment/processor.factory.ts
import { PaymentProcessor } from '../types'  // Only import PaymentProcessor from types
import { PaymentProvider } from '@prisma/client'  // Import PaymentProvider from Prisma
import { MockPaymentProcessor } from './mock.processor'
import { MTNMoMoProcessor } from './mtn-momo.processor'
import { StripeProcessor } from './stripe.processor'  // Import StripeProcessor when ready

export function getPaymentProcessor(method: PaymentProvider): PaymentProcessor {
  switch (method) {
    case PaymentProvider.MOCK:
      return new MockPaymentProcessor()
    
    case PaymentProvider.MTN_MOMO:
      return new MTNMoMoProcessor()
    
    case PaymentProvider.CARD:
      return new StripeProcessor()
    
    // Add other processors when ready
    case PaymentProvider.ORANGE_MONEY:
    case PaymentProvider.CASH:
    default:
      throw new Error(`Payment method ${method} not implemented`)
  }
}

// Optional: Export PaymentProvider for convenience
export { PaymentProvider }