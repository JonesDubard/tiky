// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../auth/[...nextauth]/route";

// import { prisma } from "lib/prisma";

// export async function GET() {
//   try {
//     const session = await getServerSession(authOptions);
    
//     if (!session || session.user.role !== "ADMIN") {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const users = await prisma.user.findMany({
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//         createdAt: true,
//         _count: {
//           select: {
//             events: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     const formattedUsers = users.map((user) => ({
//       ...user,
//       eventsCount: user._count.events,
//       _count: undefined,
//     }));

//     return NextResponse.json(formattedUsers);
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify admin status
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        // Include relations to get counts
        _count: {
          select: {
            events: true,
            orders: true,
            payments: true,
          },
        },
        // Include orders to calculate ticket count
        orders: {
          select: {
            tickets: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data with proper typing
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      // Since image doesn't exist in schema, use null or generate avatar URL
      image: null, // Or use a default avatar service like: `https://ui-avatars.com/api/?name=${user.name || user.email}`
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _count: {
        events: user._count.events,
        orders: user._count.orders,
        payments: user._count.payments,
        tickets: user.orders.reduce((total: number, order) => total + order.tickets.length, 0),
      },
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}