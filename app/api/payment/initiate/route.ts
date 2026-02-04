// app/api/payments/initiate/route.ts
import { NextResponse } from 'next/server'
import { prisma } from 'lib/prisma'

export async function POST(request: Request) {
  try {
    const { eventId, ticketId, userId, phoneNumber } = await request.json()

    // Validate input
    if (!eventId || !ticketId || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get ticket details
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: ticket.price,
        currency: 'LRD',
        status: 'PENDING',
        provider: 'MTN_MOMO',
        userId: userId || null,
        eventId,
        ticketId,
        providerRef: `TIKY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    })

    // In production: Call MTN MoMo API here
    // For development, simulate payment
    const momoResponse = {
      success: true,
      transactionId: `MOMO-${Date.now()}`,
      message: 'Payment initiated successfully',
      paymentId: payment.id
    }

    // Update payment with provider reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef: momoResponse.transactionId,
        callbackData: {
          phoneNumber,
          initiatedAt: new Date().toISOString(),
          status: 'pending'
        }
      }
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      transactionId: momoResponse.transactionId,
      amount: ticket.price,
      currency: 'LRD',
      message: 'Payment initiated. Complete via MTN MoMo prompt.'
    })

  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}