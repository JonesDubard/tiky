// app/api/events/[id]/latest-transaction/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    console.log('Fetching latest transaction for event:', (await params).id, 'phone:', phone);
    
    // Get the latest transaction for this event
    const transaction = await prisma.transaction.findFirst({
      where: {
        eventId: (await params).id,
        ...(phone ? { phoneNumber: phone } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        ticket: true, // This should work based on your schema
        event: true
      }
    });

    if (!transaction) {
      console.log('No transaction found for event:', (await params).id);
      return NextResponse.json(
        { message: 'No transaction found', transaction: null },
        { status: 200 }
      );
    }

    console.log('Transaction found:', transaction.id, 'status:', transaction.status);
    
    // Format the response
    const response = {
      transaction: {
        id: transaction.id,
        transactionRef: transaction.transactionRef,
        status: transaction.status,
        phoneNumber: transaction.phoneNumber,
        paymentMethod: transaction.paymentMethod,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        // Handle ticket relation (could be single ticket or array)
        tickets: transaction.ticket ? [transaction.ticket] : []
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching latest transaction:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
