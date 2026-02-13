import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Liberia Mobile Money Providers
enum MobileMoneyProvider {
  MTN = 'MTN',
  ORANGE = 'ORANGE',
  LONEESTAR = 'LONEESTAR' // Cellcom Lonestar
}

interface MobileMoneyRequest {
  phoneNumber: string;      // Liberia format: 077XXXXXX or 088XXXXXX
  amount: number;
  provider: MobileMoneyProvider;
  eventId: string;
  ticketTypeId: string;
  customerName?: string;
  customerEmail?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: MobileMoneyRequest = await req.json();
    const { phoneNumber, amount, provider, eventId, ticketTypeId, customerName, customerEmail } = body;

    // 1. Validate Liberia phone number format
    const phoneRegex = /^(077|088|055|066|0770|0880)[0-9]{7}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { 
          error: 'Invalid Liberia phone number format',
          message: 'Please enter a valid Liberian mobile number (077XXXXXX or 088XXXXXX)'
        },
        { status: 400 }
      );
    }

    // 2. Check ticket availability
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: true }
    });

    if (!ticketType) {
      return NextResponse.json(
        { error: 'Ticket type not found' },
        { status: 404 }
      );
    }

    if (ticketType.quantity < 1) {
      return NextResponse.json(
        { error: 'Ticket sold out' },
        { status: 409 }
      );
    }

    if (ticketType.price !== amount) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // 3. Generate unique transaction reference
    const transactionRef = `TIK-${provider}-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // 4. Create payment record
    const payment = await prisma.payment.create({
      data: {
        providerRef: transactionRef,
        amount,
        currency: 'LRD',
        status: 'PENDING',
        paymentMethod: provider,
        eventId,
        userId: null, // Guest checkout
        callbackData: {
          phoneNumber,
          ticketTypeId,
          customerName,
          customerEmail,
          provider,
          initiatedAt: new Date().toISOString()
        }
      }
    });

    // 5. Simulate USSD push or API call to provider
    // In production: Replace with actual MTN/Orange API
    const paymentResponse = await initiateMobileMoneyPayment({
      provider,
      phoneNumber,
      amount,
      transactionRef,
      description: `${ticketType.event.title} - ${ticketType.name}`
    });

    // 6. Return payment instructions
    return NextResponse.json({
      success: true,
      transactionId: transactionRef,
      paymentId: payment.id,
      provider,
      instructions: getPaymentInstructions(provider, phoneNumber, amount),
      ussdCode: getUSSDCode(provider),
      amount,
      currency: 'LRD',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('[MOBILE_MONEY_ERROR]', error);
    return NextResponse.json(
      { 
        error: 'Payment initiation failed',
        message: 'Please try again or contact customer support'
      },
      { status: 500 }
    );
  }
}

// GET: Check payment status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionRef = searchParams.get('transactionId');

    if (!transactionRef) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { providerRef: transactionRef },
      include: {
        event: {
          select: { title: true }
        },
        order: {
          include: {
            tickets: {
              select: { qrCode: true }
            }
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

    const statusMap = {
      'PENDING': 'pending',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'REFUNDED': 'refunded'
    };

    return NextResponse.json({
      status: statusMap[payment.status] || payment.status,
      amount: payment.amount,
      currency: payment.currency,
      eventName: payment.event?.title,
      ticketCount: payment.order?.tickets.length || 0,
      qrCode: payment.order?.tickets[0]?.qrCode,
      completedAt: payment.processedAt
    });

  } catch (error) {
    console.error('[PAYMENT_STATUS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

// Helper: Initiate payment with provider
async function initiateMobileMoneyPayment(params: any) {
  const { provider, phoneNumber, amount, transactionRef, description } = params;
  
  // Mock implementation - Replace with actual API calls
  switch (provider) {
    case 'MTN':
      // MTN Liberia MoMo API
      console.log(`📱 MTN: Push to ${phoneNumber} for LRD ${amount}`);
      return {
        success: true,
        providerRef: transactionRef,
        message: 'Please check your phone for payment request'
      };
    
    case 'ORANGE':
      // Orange Money Liberia API
      console.log(`📱 ORANGE: Push to ${phoneNumber} for LRD ${amount}`);
      return {
        success: true,
        providerRef: transactionRef,
        message: 'Dial *144# to complete payment'
      };
    
    default:
      return {
        success: true,
        providerRef: transactionRef,
        message: 'Payment initiated'
      };
  }
}

// Helper: Get payment instructions by provider
function getPaymentInstructions(provider: MobileMoneyProvider, phoneNumber: string, amount: number): string[] {
  const instructions: Record<MobileMoneyProvider, string[]> = {
    'MTN': [
      `1. Check your phone for a payment request from MTN Mobile Money`,
      `2. Enter your PIN to confirm payment of LRD ${amount}`,
      `3. Wait for confirmation SMS`,
      `4. You will receive your ticket via SMS`
    ],
    'ORANGE': [
      `1. Dial *144# on your phone`,
      `2. Select "Pay Bill"`,
      `3. Enter merchant code: 123456`,
      `4. Enter amount: LRD ${amount}`,
      `5. Enter reference: ${phoneNumber.slice(-4)}`,
      `6. Confirm payment`
    ],
    'LONEESTAR': [
      `1. Dial *121# on your phone`,
      `2. Select "Mobile Money"`,
      `3. Choose "Pay Merchant"`,
      `4. Enter code: 7890`,
      `5. Enter amount: LRD ${amount}`,
      `6. Confirm with PIN`
    ]
  };

  return instructions[provider] || ['Please complete payment on your mobile phone'];
}

// Helper: Get USSD code for provider
function getUSSDCode(provider: MobileMoneyProvider): string {
  const codes = {
    'MTN': '*126#',
    'ORANGE': '*144#',
    'LONEESTAR': '*121#'
  };
  return codes[provider] || '*126#';
}