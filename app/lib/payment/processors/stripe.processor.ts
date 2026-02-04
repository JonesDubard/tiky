// app/lib/payment/processors/stripe.processor.ts
import { BasePaymentProcessor } from './base.processor'
import { PaymentRequest, PaymentResult } from '../types'
import { prisma } from 'lib/prisma'  // Add this import
import { TransactionStatus, TicketStatus, PaymentProvider } from '@prisma/client'

export class StripeProcessor extends BasePaymentProcessor {
  protected providerName = 'Stripe'
  protected paymentMethod: PaymentProvider = PaymentProvider.CARD  // Use enum, not string
  
  private stripeSecretKey: string
  private stripePublicKey: string
  
  constructor() {
    super()  // IMPORTANT: Call parent constructor first
    // TODO: Load from environment variables
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'placeholder_key'
    this.stripePublicKey = process.env.STRIPE_PUBLIC_KEY || 'placeholder_key'
    
    // Comment out until you get real credentials
    // if (!this.stripeSecretKey || !this.stripePublicKey) {
    //   throw new Error('Stripe API credentials not configured')
    // }
  }
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const amount = await this.getEventPrice(request.eventId)
      
      // Create transaction
      const transactionId = await this.createTransaction(request, amount)
      
      // Create ticket (pending)
      const ticketId = await this.generateTicket(request)
      
      // Link them
      await this.linkTicketToTransaction(ticketId, transactionId)
      
      // TODO: Implement actual Stripe API call
      // For now, simulate like mock payment
      
      console.log(`[Stripe] Would process payment for:`, {
        amount,
        transactionId,
        ticketId,
        email: request.email
      })
      
      // Simulate payment success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await this.updateTransactionStatus(
        transactionId, 
        TransactionStatus.COMPLETED, 
        { 
          provider: 'STRIPE',
          simulated: true,
          processedAt: new Date().toISOString() 
        }
      )
      
      await this.updateTicketStatus(ticketId, TicketStatus.PAID)
      
      return {
        success: true,
        transactionId,
        ticketId,
        redirectUrl: `/checkout/success/${ticketId}`,
        providerData: {
          stripePublicKey: this.stripePublicKey,
          amount: amount * 100, // Stripe uses cents
          message: 'Stripe payment simulated (placeholder)'
        }
      }
      
    } catch (error) {
      console.error('Stripe payment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment failed'
      }
    }
  }
  
  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    try {
      // TODO: Implement Stripe payment verification
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      })
      
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        }
      }
      
      console.log(`[Stripe] Would verify payment for transaction: ${transactionId}`)
      
      return {
        success: true,
        transactionId,
        providerData: { 
          verified: true, 
          status: transaction.status,
          stripeTransactionId: transaction.providerRef 
        }
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      }
    }
  }
  
  async handleWebhook(data: any): Promise<boolean> {
    try {
      // TODO: Implement Stripe webhook handler
      console.log('[Stripe] Webhook received:', data)
      
      // Extract Stripe event data
      const { type, data: eventData } = data
      
      if (type === 'checkout.session.completed' || type === 'payment_intent.succeeded') {
        // Extract transaction ID from metadata
        const transactionId = eventData?.object?.metadata?.transactionId
        
        if (transactionId) {
          await this.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED, data)
          
          // Update ticket status
          const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { ticket: true }
          })
          
          if (transaction?.ticket) {
            await this.updateTicketStatus(transaction.ticket.id, TicketStatus.PAID)
          }
        }
      }
      
      return true
      
    } catch (error) {
      console.error('Stripe webhook error:', error)
      return false
    }
  }
}