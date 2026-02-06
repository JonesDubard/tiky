// app/api/payment/mock/route.ts - COMPLETELY FIXED
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, tickets, totalAmount, guestName, guestEmail, phoneNumber } = body;

    // Validate required fields
    if (!eventId || !tickets || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. First, verify the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // 2. Create a mock transaction with proper relation to event
    const transactionRef = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Fix: Type-safe ticket data
    const ticketData = tickets as Record<string, number>;
    
    const transaction = await prisma.transaction.create({
      data: {
        transactionRef,
        amount: parseFloat(totalAmount), // Ensure it's a number
        total: parseFloat(totalAmount) * 1.05, // Include 5% fee
        currency: 'LRD',
        status: 'COMPLETED',
        paymentMethod: 'MOCK',
        provider: 'MTN_MOMO_MOCK',
        phoneNumber: phoneNumber || '0777123456',
        email: guestEmail || '',
        fullName: guestName || '',
        providerRef: `MTN-${Date.now()}`,
        providerData: {
          mock: true,
          simulated: true,
          timestamp: new Date().toISOString()
        },
        // Proper relation to event
        event: {
          connect: { id: eventId }
        },
        // Guest purchase - use undefined instead of null
        userId: undefined,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'Mock/1.0'
      }
    });

    // 3. Create tickets with proper relations
    const createdTickets = [];
    
    // Type-safe conversion
    const ticketEntries = Object.entries(ticketData);
    
    for (const [ticketTypeId, quantity] of ticketEntries) {
      const qty = quantity as number;
      
      if (qty > 0) {
        // Find the ticket type/template
        const ticketTemplate = await prisma.ticket.findUnique({
          where: { id: ticketTypeId as string }
        });

        if (ticketTemplate) {
          for (let i = 0; i < qty; i++) {
            const ticket = await prisma.ticket.create({
              data: {
                ticketId: `TIK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                qrCodeHash: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: 'PAID',
                type: ticketTemplate.type || 'General Admission',
                price: ticketTemplate.price,
                quantity: 1,
                guestEmail: guestEmail || '',
                guestName: guestName || '',
                // Proper relation to event
                event: {
                  connect: { id: eventId }
                },
                // Proper relation to transaction
                transaction: {
                  connect: { id: transaction.id }
                }
              }
            });
            createdTickets.push(ticket);
          }
        } else {
          // If ticket template not found, create a generic ticket
          const totalQty = Object.values(ticketData).reduce((a: number, b: number) => a + b, 0);
          const avgPrice = totalQty > 0 ? parseFloat(totalAmount) / totalQty : parseFloat(totalAmount);
          
          const ticket = await prisma.ticket.create({
            data: {
              ticketId: `TIK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
              qrCodeHash: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              status: 'PAID',
              type: 'General Admission',
              price: avgPrice,
              quantity: 1,
              guestEmail: guestEmail || '',
              guestName: guestName || '',
              event: {
                connect: { id: eventId }
              },
              transaction: {
                connect: { id: transaction.id }
              }
            }
          });
          createdTickets.push(ticket);
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      transactionRef: transaction.transactionRef,
      tickets: createdTickets.map(t => ({
        id: t.id,
        ticketId: t.ticketId,
        qrCodeHash: t.qrCodeHash,
        type: t.type,
        price: t.price
      })),
      message: 'Mock payment successful'
    });

  } catch (error) {
    console.error('Mock payment error:', error);
    return NextResponse.json(
      { 
        error: 'Payment processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}