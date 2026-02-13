import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';

// ✅ POST - Create new event
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Not logged in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { title, description, date, location, imageUrl, published, isFeatured, tickets } = body;

    // 3. Validate required fields
    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      );
    }
    

    // 4. Get admin user from database
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found in database' },
        { status: 404 }
      );
    }

    console.log('Creating event with data:', {
      title,
      date,
      location,
      createdById: adminUser.id
    });

    // 5. Create the event
    const event = await prisma.event.create({
      data: {
        title,
        description: description || '',
        date: new Date(date),
        location,
        imageUrl: imageUrl || null,
        published: published || false,
        isFeatured: isFeatured || false,
        price: tickets?.[0]?.price ? parseFloat(tickets[0].price) : 0,
        createdById: adminUser.id,
      },
    });

    console.log('Event created:', event.id);

    // 6. Create tickets if provided
    if (tickets && Array.isArray(tickets) && tickets.length > 0) {
      const ticketData = tickets.map((ticket: any) => ({
        eventId: event.id,
        type: ticket.type || 'General Admission',
        price: parseFloat(ticket.price) || 0,
        quantity: parseInt(ticket.quantity) || 1,
        status: 'PENDING',
        isTemplate: true,
        ticketId: `TIK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        qrCodeHash: `QR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      }));

      await prisma.ticket.createMany({
        data: ticketData,
      });

      console.log(`Created ${ticketData.length} tickets for event ${event.id}`);
    }

    return NextResponse.json({
      success: true,
      event,
      message: 'Event created successfully',
    });

  } catch (error) {
    // 7. Detailed error logging
    console.error('❌ Create event error:');
    console.error(error);
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Database error: User not found' },
          { status: 500 }
        );
      }
      if (error.message.includes('Column')) {
        return NextResponse.json(
          { error: `Database schema error: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create event. Check server logs.' },
      { status: 500 }
    );
  }
}

// ✅ GET - Fetch all events for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const events = await prisma.event.findMany({
      include: {
        tickets: {
          where: {
            isTemplate: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            tickets: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('❌ Fetch events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}