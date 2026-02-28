import { NextRequest, NextResponse } from "next/server"
import { OrangeMoneyProcessor } from "lib/payment/processors/orange-money.processor"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("Orange Money payment body:", body)

    const processor = new OrangeMoneyProcessor()
    const result = await processor.processPayment({
      ...body,
      paymentMethod: "orange_money",
    })

    if (!result.success) {
      console.error("Orange Money processor failed:", result.error)
      return NextResponse.json({ message: result.error }, { status: 400 })
    }

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      orderId: result.orderId,
      paymentId: result.paymentId,
      referenceId: result.referenceId,
    })
  } catch (err: any) {
    console.error("Orange Money route crashed:", err)
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    )
  }
}