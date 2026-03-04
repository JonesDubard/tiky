// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { prisma } from 'lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    // Detect context: admin dashboard calls vs. public search calls
    const isAdminRequest = searchParams.get("admin") === "true"

    // Admin-only route guard (only enforced for admin=true requests)
    if (isAdminRequest && (!session || session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // --- new search/filter params (public page) ---
    const search    = searchParams.get("search")    ?? "";
    const timeframe = searchParams.get("timeframe") ?? "";  // 'week' | 'month'
    const pricing   = searchParams.get("pricing")   ?? "";  // 'free' | 'paid'
    const featured  = searchParams.get("featured")  === "true";
    const sort      = searchParams.get("sort")      ?? "date"; // 'date' | 'name' | 'price'

    const now   = new Date();
    const week  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
    const month = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (isAdminRequest) {
      // --- original admin query (unchanged) ---
      const events = await prisma.event.findMany({
        where: { deletedAt: null },
        include: {
          createdBy: { select: { name: true, email: true } },
          _count: { select: { ticketTypes: true, polls: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(events)
    }

    // --- public search/filter query ---
    const events = await prisma.event.findMany({
      where: {
        published:  true,
        deletedAt:  null,
        date: {
          gte: now,
          ...(timeframe === 'week'  ? { lte: week  } : {}),
          ...(timeframe === 'month' ? { lte: month } : {}),
        },
        ...(featured && { isFeatured: true }),
        ...(search && {
          OR: [
            { title:    { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        ticketTypes: {
          select: { id: true, name: true, price: true, quantity: true },
        },
        _count: { select: { ticketTypes: true } },
      },
      orderBy:
        sort === 'name' ? { title: 'asc' } :
        { date: 'asc' },
    })

    // pricing filter applied post-query (requires ticket data)
    const filtered = events.filter(event => {
      if (!pricing) return true;
      const prices = event.ticketTypes.map(t => t.price);
      if (pricing === 'free') return prices.some(p => p === 0);
      if (pricing === 'paid') return prices.every(p => p > 0);
      return true;
    });

    const result = filtered.map(event => {
      const ticketTypes = event.ticketTypes || [];
      const minPrice = ticketTypes.length > 0
        ? Math.min(...ticketTypes.map(t => t.price))
        : 0;
      return {
        id:          event.id,
        title:       event.title,
        description: event.description,
        date:        event.date,
        location:    event.location,
        imageUrl:    event.imageUrl,
        isFeatured:  event.isFeatured || false,
        ticketTypes: ticketTypes.map(t => ({
          id: t.id, name: t.name, price: t.price, quantity: t.quantity,
        })),
        minPrice,
      };
    });

    return NextResponse.json({ events: result, total: result.length })

  } catch (error) {
    console.error('GET /api/events error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, date, location, price, tickets = [] } = body

    if (!title || !date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date, location' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (prisma) => {
      const event = await prisma.event.create({
        data: {
          title,
          description: body.description || '',
          date:        new Date(date),
          location,
          imageUrl:    body.imageUrl    || null,
          published:   body.published   || false,
          isFeatured:  body.isFeatured  || false,
          createdById: session.user.id,
        },
      })

      const createdTicketTypes = []
      if (tickets && Array.isArray(tickets) && tickets.length > 0) {
        for (const ticketData of tickets) {
          if (ticketData.type && ticketData.price !== undefined) {
            const ticketType = await prisma.ticketType.create({
              data: {
                name:        ticketData.type,
                price:       parseFloat(ticketData.price),
                quantity:    parseInt(ticketData.quantity || 100),
                eventId:     event.id,
                maxPerOrder: ticketData.maxPerOrder || 5,
                salesStart:  ticketData.salesStart ? new Date(ticketData.salesStart) : null,
                salesEnd:    ticketData.salesEnd   ? new Date(ticketData.salesEnd)   : null,
                description: ticketData.description || null,
              },
            })
            createdTicketTypes.push(ticketType)
          }
        }
      } else {
        const defaultTicketType = await prisma.ticketType.create({
          data: {
            name:        'General Admission',
            price:       price ? parseFloat(price) : 0,
            quantity:    100,
            eventId:     event.id,
            maxPerOrder: 5,
          },
        })
        createdTicketTypes.push(defaultTicketType)
      }

      return { event, ticketTypes: createdTicketTypes }
    })

    return NextResponse.json({
      success:         true,
      eventId:         result.event.id,
      ticketTypeCount: result.ticketTypes.length,
      message:         'Event created successfully with ticket types',
    })
  } catch (error) {
    console.error('POST /api/events error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}