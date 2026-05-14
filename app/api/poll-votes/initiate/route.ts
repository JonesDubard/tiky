// app/api/poll-votes/initiate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { requestToPay, normalisePhone } from "lib/momo"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pollId, optionId, quantity, phoneNumber, paymentMethod } = body as {
      pollId: string
      optionId: string
      quantity: number
      phoneNumber: string
      paymentMethod: "mtn_momo" | "orange_money"
    }

    if (!pollId || !optionId || !quantity || !phoneNumber || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    // Validate poll
    const poll = await prisma.poll.findUnique({
      where: { id: pollId, deletedAt: null },
      select: { id: true, status: true, votePrice: true },
    })

    if (!poll || poll.status !== "ACTIVE") {
      return NextResponse.json({ error: "This poll is not active." }, { status: 400 })
    }

    if (!poll.votePrice || poll.votePrice <= 0) {
      return NextResponse.json(
        { error: "This poll does not support paid voting." },
        { status: 400 }
      )
    }

    // Validate option
    const option = await prisma.pollOption.findUnique({
      where: { id: optionId },
      select: { id: true },
    })
    if (!option) {
      return NextResponse.json({ error: "Invalid contestant selected." }, { status: 400 })
    }

    // Validate phone
    const msisdn = normalisePhone(phoneNumber)
    if (!msisdn) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 })
    }

    const totalAmount = poll.votePrice * quantity
    const referenceId = crypto.randomUUID()

    // userId is optional — guests are welcome
    // We do a best-effort session check but never block on it
    let userId: string | null = null
    try {
      const { getServerSession } = await import("next-auth")
      const { authOptions } = await import("lib/auth")
      const session = await getServerSession(authOptions)
      userId = session?.user?.id ?? null
    } catch {
      // no session — that's fine
    }

    console.log("[MOMO PHONE]", {
    original: phoneNumber,
    normalized: msisdn,
})

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        providerRef: referenceId,
        amount: totalAmount,
        currency: "USD",
        status: "PENDING",
        paymentMethod,
        userId, // null for guests
        metadata: JSON.stringify({
          type: "vote",
          pollId,
          optionId,
          quantity,
        }),
      },
    })

    // Send MoMo request
    if (paymentMethod === "mtn_momo") {
      try {
        await requestToPay({
          referenceId,
          amount: totalAmount.toFixed(2),
          currency: "USD",
          partyId: msisdn,
          payerMessage: `Vote purchase – poll ${pollId.slice(0, 8)}`,
          payeeNote: `${quantity} vote${quantity !== 1 ? "s" : ""}`,
        })
      } catch (err) {
        console.error("[VOTE INITIATE] MoMo request failed:", err)
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        })
        return NextResponse.json(
          { error: "Could not initiate payment. Please try again." },
          { status: 502 }
        )
      }
    } else {
      // Orange Money not yet integrated
      return NextResponse.json(
        { error: "Orange Money is not yet available." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      paymentId: payment.id,
      referenceId,
    })

  } catch (error) {
    console.error("[VOTE INITIATE] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}