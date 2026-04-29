// app/api/webhooks/mtn-momo/route.ts

import { prisma } from "lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { referenceId, status } = body

    const payment = await prisma.payment.findUnique({
      where: { providerRef: referenceId },
    })

    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Idempotent safety
    if (payment.status === "COMPLETED") {
      return NextResponse.json({ success: true })
    }

    if (status !== "SUCCESSFUL") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      })

      return NextResponse.json({ success: true })
    }

    // ✅ ONLY mark payment as completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[WEBHOOK ERROR]", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}