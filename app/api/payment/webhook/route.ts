import { NextResponse } from 'next/server'
import { prisma } from 'lib/prisma'
import { PaymentStatus, OrderStatus, TicketStatus } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    // MTN MoMo / Orange Money payload structure
    const { 
      transactionId, 
      status, 
      amount, 
      currency = 'LRD', // Liberia Dollar default
      externalId,
      msisdn // Phone number for SMS delivery
    } = payload

    // Find payment by provider reference
    const payment = await prisma.payment.findFirst({
      where: { 
        providerRef: transactionId || externalId 
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Update payment status first
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED',
        callbackData: JSON.stringify(payload),
        processedAt: status === 'SUCCESSFUL' ? new Date() : null,
        updatedAt: new Date()
      }
    })

    // Handle successful payment
    if (status === 'SUCCESSFUL') {
      // Find the ticket type being purchased
      // Note: You need to pass ticketTypeId in your initiate call and store it
      const ticketTypeId = payment.callbackData?.ticketTypeId || 
                          (await getTicketTypeFromPayment(payment.id));

      if (!ticketTypeId) {
        throw new Error('TICKET_TYPE_NOT_FOUND');
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Lock and decrement ticket type quantity
        const ticketType = await tx.ticketType.update({
          where: { 
            id: ticketTypeId,
            quantity: { gt: 0 }
          },
          data: { 
            quantity: { decrement: 1 }
          }
        });

        if (!ticketType) {
          throw new Error('TICKET_SOLD_OUT');
        }

        // 2. Generate unique QR code for ticket instance
        const qrCode = generateQRCode(payment.id, ticketTypeId);

        // 3. Create the actual ticket instance
        const ticketInstance = await tx.ticketInstance.create({
          data: {
            status: 'PAID',
            qrCode,
            guestName: payload.customerName,
            guestEmail: payload.customerEmail,
            phoneNumber: msisdn || payload.phoneNumber, // Critical for Liberia SMS delivery
            ticketTypeId: ticketType.id,
            ticketType: {
              connect: { id: ticketType.id }
            }
          }
        });

        // 4. Create order with reference to payment and ticket
        const order = await tx.order.create({
          data: {
            userId: payment.userId,
            status: 'CONFIRMED',
            totalPrice: payment.amount,
            paymentId: payment.id,
            tickets: {
              connect: [{ id: ticketInstance.id }]
            }
          }
        });

        return { ticketType, ticketInstance, order };
      }, {
        isolationLevel: 'Serializable',
        timeout: 10000
      });

      console.log('✅ Ticket purchased successfully:', {
        orderId: result.order.id,
        ticketInstanceId: result.ticketInstance.id,
        eventId: payment.eventId
      });

      // TODO: Trigger SMS delivery via Liberia Telecom / Orange
      // await sendTicketSMS(msisdn, result.ticketInstance.qrCode, payment.event.title);
    }

    return NextResponse.json({ 
      success: true,
      paymentId: payment.id,
      status: updatedPayment.status
    })

  } catch (error: any) {
    console.error('Webhook error:', error);
    
    // Handle specific error types
    if (error.message === 'TICKET_SOLD_OUT') {
      return NextResponse.json(
        { error: 'Ticket sold out' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Helper function for GET endpoint (simulated webhook for testing)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionRef = searchParams.get('transactionId');
    const status = searchParams.get('status') || 'SUCCESSFUL';
    const phoneNumber = searchParams.get('phone'); // Liberia phone for SMS

    if (!transactionRef) {
      return NextResponse.json(
        { error: 'transactionId required' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { providerRef: transactionRef },
      include: {
        event: true,
        order: {
          include: {
            tickets: true
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED',
        processedAt: status === 'SUCCESSFUL' ? new Date() : null,
        callbackData: {
          webhookReceived: new Date().toISOString(),
          simulated: true,
          phoneNumber
        }
      }
    });

    // If successful but no order exists (simulated flow)
    if (status === 'SUCCESSFUL' && !payment.order) {
      // Find ticket type (in simulation, use first available)
      const ticketType = await prisma.ticketType.findFirst({
        where: { 
          eventId: payment.eventId!,
          quantity: { gt: 0 }
        }
      });

      if (ticketType) {
        // Create ticket instance and order
        await prisma.$transaction(async (tx) => {
          // Decrement quantity
          await tx.ticketType.update({
            where: { id: ticketType.id },
            data: { quantity: { decrement: 1 } }
          });

          // Create ticket instance
          const ticketInstance = await tx.ticketInstance.create({
            data: {
              status: 'PAID',
              qrCode: generateQRCode(payment.id, ticketType.id),
              phoneNumber,
              ticketTypeId: ticketType.id
            }
          });

          // Create order
          await tx.order.create({
            data: {
              userId: payment.userId,
              status: 'CONFIRMED',
              totalPrice: payment.amount,
              paymentId: payment.id,
              tickets: {
                connect: [{ id: ticketInstance.id }]
              }
            }
          });
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${status.toLowerCase()}`,
      paymentId: payment.id,
      ticketCount: payment.order?.tickets.length || 0
    });

  } catch (error) {
    console.error('Simulated webhook error:', error);
    return NextResponse.json(
      { error: 'Transaction not found or update failed' },
      { status: 404 }
    );
  }
}

// Utility function for QR code generation
function generateQRCode(paymentId: string, ticketTypeId: string): string {
  // Format: TIK-{PAYMENT_ID_SHORT}-{TIMESTAMP}
  const shortId = paymentId.slice(-8);
  const timestamp = Date.now().toString(36).toUpperCase();
  return `TIK-${shortId}-${timestamp}`;
}

// Helper to get ticket type ID from payment metadata
async function getTicketTypeFromPayment(paymentId: string): Promise<string | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { callbackData: true }
  });
  
  return payment?.callbackData?.ticketTypeId || null;
}