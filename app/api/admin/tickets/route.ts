import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const tickets = await prisma.ticketInstance.findMany({
      where: search ? {
        OR: [
          { id: { contains: search } },
          { order: { user: { email: { contains: search } } } },
          { order: { user: { name: { contains: search } } } },
        ]
      } : {},
      select: {
        id: true,
        status: true,
        qrCode: true,
        qrImage: true,
        guestName: true,
        guestEmail: true,
        phoneNumber: true,
        validatedAt: true,
        createdAt: true,
        ticketType: {
          select: {
            id: true,
            name: true,
            price: true,
            event: {
              select: {
                id: true,
                title: true,
                date: true,
              }
            }
          }
        },
        order: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { startDate, endDate } = await req.json();

    // Generate CSV export
    const tickets = await prisma.ticketInstance.findMany({
      where: {
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        }
      },
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

    // Format for CSV
    const csvData = tickets.map(ticket => ({
      'Ticket ID': ticket.id,
      'Event': ticket.ticketType.event.title,
      'Customer': ticket.order?.user?.name || ticket.guestName || 'N/A',
      'Email': ticket.order?.user?.email || ticket.guestEmail || 'N/A',
      'Status': ticket.status,
      'Purchase Date': new Date(ticket.createdAt).toLocaleDateString(),
      'Price': ticket.ticketType.price,
    }));

    return NextResponse.json(csvData);
  } catch (error) {
    console.error("Error exporting tickets:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}