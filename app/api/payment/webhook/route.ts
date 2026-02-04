// app/api/payments/webhook/route.ts
import { NextResponse } from 'next/server'
import { prisma } from 'lib/prisma'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    // Verify it's from MTN MoMo (in production, verify signature)
    const { transactionId, status, amount, currency, externalId } = payload

    // Find payment by provider reference
    const payment = await prisma.payment.findFirst({
      where: { providerRef: transactionId || externalId }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED',
        callbackData: payload,
        updatedAt: new Date()
      },
      include: {
        ticket: true,
        event: true
      }
    })

    // If payment completed, create ticket/order
    if (status === 'SUCCESSFUL') {
      // Create order
      await prisma.order.create({
        data: {
          userId: payment.userId || 'guest',
          ticketId: payment.ticketId!,
          quantity: 1,
          totalPrice: payment.amount,
          status: 'CONFIRMED'
        }
      })

      // Update ticket quantity
      await prisma.ticket.update({
        where: { id: payment.ticketId! },
        data: {
          quantity: {
            decrement: 1
          }
        }
      })

      // TODO: Send email confirmation
      console.log('✅ Payment completed, order created for user:', payment.userId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}