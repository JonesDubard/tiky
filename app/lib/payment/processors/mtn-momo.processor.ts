// app/lib/payment/processors/mtn-momo.processor.ts
import { BasePaymentProcessor } from './base.processor'
import { PaymentRequest, PaymentResult } from '../types'
import { prisma } from 'lib/prisma' 
import { TransactionStatus, TicketStatus, PaymentProvider } from '@prisma/client'

export class MTNMoMoProcessor extends BasePaymentProcessor {
  protected providerName = 'MTN MoMo'
  protected paymentMethod: PaymentProvider = PaymentProvider.MTN_MOMO  // Use enum, not string
  
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  
  constructor() {
    super()  // Call parent constructor
    // TODO: Load from environment variables when you get credentials
    this.apiKey = process.env.MTN_MOMO_API_KEY || 'placeholder_key'
    this.apiSecret = process.env.MTN_MOMO_API_SECRET || 'placeholder_secret'
    this.baseUrl = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com'
    
    // Comment this out until you get real credentials
    // if (!this.apiKey || !this.apiSecret) {
    //   throw new Error('MTN MoMo API credentials not configured')
    // }
  }
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!request.phoneNumber) {
      return {
        success: false,
        error: 'Phone number is required for MTN MoMo payment'
      }
    }
    
    try {
      const amount = await this.getEventPrice(request.eventId)
      
      // Create transaction
      const transactionId = await this.createTransaction(request, amount)
      
      // Create ticket (pending)
      const ticketId = await this.generateTicket(request)
      
      // Link them
      await this.linkTicketToTransaction(ticketId, transactionId)
      
      // TODO: IMPLEMENT ACTUAL MTN MOMO API CALL HERE
      // This is a placeholder - replace with actual API implementation
      
      console.log(`[MTN MoMo] Would process payment for:`, {
        phoneNumber: request.phoneNumber,
        amount,
        transactionId,
        ticketId
      })
      
      // For now, simulate success (like mock payment)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await this.updateTransactionStatus(
        transactionId, 
        TransactionStatus.COMPLETED, 
        { 
          provider: 'MTN_MOMO',
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
          message: 'MTN MoMo payment simulated (placeholder)',
          instruction: 'In production, user would be redirected to MTN MoMo'
        }
      }
      
    } catch (error) {
      console.error('MTN MoMo payment failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MTN MoMo payment failed'
      }
    }
  }
  
  async verifyPayment(transactionId: string): Promise<PaymentResult> {
    try {
      // TODO: Implement actual MTN MoMo payment verification
      // This would check the status with MTN MoMo API
      
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      })
      
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        }
      }
      
      console.log(`[MTN MoMo] Would verify payment for transaction: ${transactionId}`)
      
      // Placeholder - in production, call MTN MoMo API
      return {
        success: true,
        transactionId,
        providerData: { verified: true, status: transaction.status }
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
      // TODO: Implement MTN MoMo webhook handler
      // This is called when MTN MoMo sends payment confirmation
      
      console.log('[MTN MoMo] Webhook received:', data)
      
      // Extract transaction ID and status from webhook
      const { transactionId, status } = data
      
      if (!transactionId) {
        console.error('No transactionId in webhook data')
        return false
      }
      
      if (status === 'SUCCESSFUL') {
        await this.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED, data)
        
        // Update ticket status
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
          include: { ticket: true }
        })
        
        if (transaction?.ticket) {
          await this.updateTicketStatus(transaction.ticket.id, TicketStatus.PAID)
        }
      } else {
        await this.updateTransactionStatus(transactionId, TransactionStatus.FAILED, data)
      }
      
      return true
      
    } catch (error) {
      console.error('MTN MoMo webhook error:', error)
      return false
    }
  }
}