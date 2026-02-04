// app/lib/payment/processors/mock.processor.ts
import { BasePaymentProcessor } from './base.processor'
import { PaymentRequest, PaymentResult } from '../types'
import { TransactionStatus, TicketStatus, PaymentProvider } from '@prisma/client'

export class MockPaymentProcessor extends BasePaymentProcessor {
  protected providerName = 'Mock Payment'
  protected paymentMethod = PaymentProvider.MOCK
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const amount = await this.getEventPrice(request.eventId)
      
      // Create transaction
      const transactionId = await this.createTransaction(request, amount)
      
      // Create ticket
      const ticketId = await this.generateTicket(request)
      
      // Link them
      await this.linkTicketToTransaction(ticketId, transactionId)
      
      // Mark as completed
      await this.updateTransactionStatus(
        transactionId, 
        TransactionStatus.COMPLETED, 
        { mock: true, processedAt: new Date().toISOString() }
      )
      
      await this.updateTicketStatus(ticketId, TicketStatus.PAID)
      
      return {
        success: true,
        transactionId,
        ticketId,
        redirectUrl: `/checkout/success/${ticketId}`
      }
      
    } catch (error) {
      console.error('Mock payment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }
  
  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    return { success: true, transactionId }
  }
  
  async handleWebhook(data: any): Promise<boolean> {
    return true
  }
}