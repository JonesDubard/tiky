import { NextRequest, NextResponse } from "next/server";
import { getProcessor } from "lib/payment/processor.factory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Received payment body:", body);

    const processor = getProcessor("card");

    const result = await processor.processPayment({
      ...body,
      paymentMethod: "card",
    });

    if (!result.success) {
      console.error("Processor failed:", result.error);
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      );
    }

    // ✅ Explicitly check clientSecret exists before accessing it
    if (!result.clientSecret) {
      console.error("No clientSecret returned from processor");
      return NextResponse.json(
        { message: "Payment processor did not return a client secret" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: result.clientSecret, // ✅ TypeScript now knows this is a string
      orderId: result.orderId,
      paymentId: result.paymentId,
    });

  } catch (err: any) {
    console.error("Initiate card route crashed:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}