// app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    
    console.log('Fetching ticket with ID:', ticketId);
    
    // Try to find the ticket by id or ticketId
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: ticketId },
          { ticketId: ticketId }
        ]
      },
      include: {
        event: true,
        transaction: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!ticket) {
      console.log('Ticket not found for ID:', ticketId);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    console.log('Ticket found:', ticket.ticketId);
    
    // Format the response
    const ticketData = {
      id: ticket.id,
      ticketId: ticket.ticketId,
      qrCodeHash: ticket.qrCodeHash,
      status: ticket.status,
      price: ticket.price,
      quantity: ticket.quantity,
      guestName: ticket.guestName,
      guestEmail: ticket.guestEmail,
      createdAt: ticket.createdAt.toISOString(),
      event: {
        id: ticket.event.id,
        title: ticket.event.title,
        description: ticket.event.description,
        date: ticket.event.date?.toISOString(),
        location: ticket.event.location,
        imageUrl: ticket.event.imageUrl
      },
      user: ticket.user ? {
        name: ticket.user.name,
        email: ticket.user.email
      } : undefined,
      transaction: ticket.transaction ? {
        paymentMethod: ticket.transaction.paymentMethod,
        provider: ticket.transaction.provider,
        phoneNumber: ticket.transaction.phoneNumber
      } : undefined
    };

    return NextResponse.json(ticketData);

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}