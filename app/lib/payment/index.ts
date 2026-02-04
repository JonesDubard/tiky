// app/lib/payment/index.ts
export * from './types'
export * from './processors/processor.factory'
export { getPaymentProcessor } from './processors/processor.factory'

// Re-export Prisma enums for convenience (but users should import from @prisma/client)
export type { 
  PaymentProvider, 
  TransactionStatus, 
  TicketStatus,
  PaymentStatus 
} from '@prisma/client'