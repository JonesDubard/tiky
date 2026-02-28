import { NextRequest, NextResponse } from "next/server"
import { MTNMoMoProcessor } from "lib/payment/processors/mtn-momo.processor"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("MTN MoMo payment body:", body)

    const processor = new MTNMoMoProcessor()
    const result = await processor.processPayment({
      ...body,
      paymentMethod: "mtn_momo",
    })

    if (!result.success) {
      console.error("MTN MoMo processor failed:", result.error)
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
      paymentId: result.paymentId,
      referenceId: result.referenceId,
    })
  } catch (err: any) {
    console.error("MTN MoMo route crashed:", err)
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    )
  }
}