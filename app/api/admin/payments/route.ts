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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    const payments = await prisma.payment.findMany({
      where: {
        ...(startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        } : {}),
        ...(status && status !== "all" ? { status } : {}),
      },
      select: {
        id: true,
        providerRef: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        processedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
          }
        },
        order: {
          select: {
            id: true,
            totalPrice: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}