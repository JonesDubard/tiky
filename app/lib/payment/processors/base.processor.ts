// app/lib/payment/processors/base.processor.ts
import { PaymentProcessor, PaymentRequest, PaymentResult } from '../types'
import { prisma } from 'lib/prisma'
import { TransactionStatus, TicketStatus, PaymentProvider } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export abstract class BasePaymentProcessor implements PaymentProcessor {
  protected abstract providerName: string
  protected abstract paymentMethod: PaymentProvider
  
  protected async getEventPrice(eventId: string): Promise<number> {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })
    
    if (!event) {
      throw new Error('Event not found')
    }
    
    return event.price || 0
  }
  
  async generateTicket(request: PaymentRequest): Promise<string> {
    const amount = await this.getEventPrice(request.eventId)
    const quantity = request.quantity || 1
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketId: `TIK-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        qrCodeHash: uuidv4(),
        status: TicketStatus.PENDING,
        price: amount,
        quantity,
        eventId: request.eventId,
        userId: request.userId,
        guestEmail: request.guestEmail,
        guestName: request.guestName
      }
    })
    
    return ticket.id
  }
  
  async createTransaction(request: PaymentRequest, amount: number): Promise<string> {
    const quantity = request.quantity || 1
    const total = amount * quantity
    
    const transaction = await prisma.transaction.create({
      data: {
        transactionRef: `${this.providerName.replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount,
        total,
        status: TransactionStatus.PENDING,
        paymentMethod: this.paymentMethod,
        provider: this.providerName,
        phoneNumber: request.phoneNumber,
        email: request.email,
        fullName: request.fullName,
        userId: request.userId,
        eventId: request.eventId,
        metadata: request.metadata as any
      }
    })
    
    return transaction.id
  }
  
  async linkTicketToTransaction(ticketId: string, transactionId: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { ticketId }
    })
  }
  
  async updateTransactionStatus(
    transactionId: string, 
    status: TransactionStatus, 
    providerData?: any
  ): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        providerData: providerData as any,
        completedAt: status === TransactionStatus.COMPLETED ? new Date() : undefined
      }
    })
  }
  
  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    })
  }
  
  abstract processPayment(request: PaymentRequest): Promise<PaymentResult>
  abstract verifyPayment(transactionId: string): Promise<PaymentResult>
  abstract handleWebhook(data: any): Promise<boolean>
}