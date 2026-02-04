// app/api/payment/mock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { getPaymentProcessor, PaymentProvider } from '@/lib/payment/processors'
import { prisma } from 'lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    const { eventId, quantity = 1, guestEmail, guestName } = body
    
    // Validate event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    // Prepare payment request
    const paymentRequest = {
      eventId,
      userId: session?.user?.id,
      guestEmail: guestEmail || session?.user?.email,
      guestName: guestName || session?.user?.name,
      phoneNumber: body.phoneNumber,
      email: body.email || session?.user?.email,
      fullName: body.fullName || session?.user?.name,
      quantity,
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.ip || request.headers.get('x-forwarded-for')
      }
    }
    
    // Process payment
    const processor = getPaymentProcessor(PaymentProvider.MOCK)
    const result = await processor.processPayment(paymentRequest)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      ticketId: result.ticketId,
      redirectUrl: result.redirectUrl
    })
    
  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}