import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { qrCode, scannerId } = await req.json();
    const eventId = params.id;

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code required' },
        { status: 400 }
      );
    }

    // Atomic validation with status update
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find ticket instance by QR code
      const ticket = await tx.ticketInstance.findUnique({
        where: { qrCode },
        include: {
          ticketType: {
            include: {
              event: true
            }
          },
          order: {
            include: {
              user: true
            }
          }
        }
      });

      if (!ticket) {
        throw new Error('TICKET_NOT_FOUND');
      }

      // 2. Verify ticket belongs to this event
      if (ticket.ticketType.event.id !== eventId) {
        throw new Error('WRONG_EVENT');
      }

      // 3. Check ticket status
      if (ticket.status === 'USED') {
        throw new Error('TICKET_ALREADY_USED');
      }

      if (ticket.status === 'CANCELLED') {
        throw new Error('TICKET_CANCELLED');
      }

      if (ticket.status === 'EXPIRED') {
        throw new Error('TICKET_EXPIRED');
      }

      // 4. Check if event has passed
      const eventDate = new Date(ticket.ticketType.event.date);
      if (eventDate < new Date()) {
        throw new Error('EVENT_PASSED');
      }

      // 5. Validate event hasn't started yet (can enter 1 hour before)
      const oneHourBefore = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (new Date() < oneHourBefore) {
        throw new Error('TOO_EARLY');
      }

      // 6. Mark ticket as used
      const updatedTicket = await tx.ticketInstance.update({
        where: { id: ticket.id },
        data: {
          status: 'USED',
          validatedAt: new Date(),

        metadata: JSON.stringify({
  validatedBy: scannerId,
  validationTime: new Date().toISOString()
})  
        }
      });

      // 7. Log validation for analytics
      await tx.validationLog.create({
        data: {
          ticketId: ticket.id,
          scannerId,
          eventId,
          validatedAt: new Date()
        }
      });

      return {
        ticket: updatedTicket,
        attendeeName: ticket.guestName || ticket.order?.user?.name || 'Guest',
        attendeeEmail: ticket.guestEmail || ticket.order?.user?.email,
        ticketType: ticket.ticketType.name,
        eventName: ticket.ticketType.event.title,
        validationTime: new Date().toISOString()
      };
    }, {
      isolationLevel: 'Serializable',
      timeout: 5000
    });

    // Liberia: SMS confirmation for entry
    if (result.ticket.phoneNumber) {
      // Queue SMS: "Welcome to {eventName}! You entered at {time}"
      // await queueSMS(result.ticket.phoneNumber, `Entry confirmed for ${result.eventName}`);
    }

    return NextResponse.json({
      success: true,
      message: '✓ Valid entry',
      attendee: {
        name: result.attendeeName,
        email: result.attendeeEmail,
        ticketType: result.ticketType
      },
      eventName: result.eventName,
      timestamp: result.validationTime
    });

  } catch (error: any) {
    console.error('[VALIDATION_ERROR]', error);

    // Error mapping for Liberia event staff
    const errorMap: Record<string, { status: number; message: string }> = {
      'TICKET_NOT_FOUND': { 
        status: 404, 
        message: '❌ Invalid QR code - Ticket not found' 
      },
      'WRONG_EVENT': { 
        status: 400, 
        message: '❌ This ticket is for a different event' 
      },
      'TICKET_ALREADY_USED': { 
        status: 409, 
        message: '⚠️ Ticket already used - Previous entry detected' 
      },
      'TICKET_CANCELLED': { 
        status: 410, 
        message: '❌ Ticket has been cancelled/refunded' 
      },
      'TICKET_EXPIRED': { 
        status: 410, 
        message: '❌ Ticket has expired' 
      },
      'EVENT_PASSED': { 
        status: 410, 
        message: '❌ Event has already ended' 
      },
      'TOO_EARLY': { 
        status: 403, 
        message: '⏰ Doors open 1 hour before event start' 
      }
    };

    const mappedError = errorMap[error.message];
    if (mappedError) {
      return NextResponse.json(
        { 
          error: mappedError.message,
          code: error.message 
        },
        { status: mappedError.status }
      );
    }

    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch validation stats for an event
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    const [totalTickets, validatedTickets, ticketTypes] = await Promise.all([
      // Total tickets sold
      prisma.ticketInstance.count({
        where: {
          ticketType: {
            eventId
          },
          status: 'PAID'
        }
      }),
      
      // Validated entries
      prisma.ticketInstance.count({
        where: {
          ticketType: {
            eventId
          },
          status: 'USED'
        }
      }),
      
      // Breakdown by ticket type
      prisma.ticketType.findMany({
        where: { eventId },
        include: {
          tickets: {
            where: { status: 'PAID' },
            select: { status: true, validatedAt: true }
          }
        }
      })
    ]);

    const breakdown = ticketTypes.map(type => ({
      name: type.name,
      sold: type.tickets.length,
      validated: type.tickets.filter(t => t.validatedAt).length,
      remaining: type.tickets.length - type.tickets.filter(t => t.validatedAt).length
    }));

    return NextResponse.json({
      totalTickets,
      validatedTickets,
      remainingTickets: totalTickets - validatedTickets,
      validationRate: totalTickets > 0 
        ? Math.round((validatedTickets / totalTickets) * 100) 
        : 0,
      breakdown
    });

  } catch (error) {
    console.error('[VALIDATION_STATS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch validation stats' },
      { status: 500 }
    );
  }
}