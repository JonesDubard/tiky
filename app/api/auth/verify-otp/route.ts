import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: "Phone and code are required" }, { status: 400 })
    }

    const normalized = phone.startsWith("+")
      ? phone
      : `+231${phone.replace(/^0/, "")}`

    const otp = await prisma.phoneOtp.findFirst({
      where: {
        phone: normalized,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!otp) {
      return NextResponse.json({ error: "Code expired or not found. Request a new one." }, { status: 400 })
    }

    // Block brute force — check BEFORE incrementing
    if (otp.attempts >= 5) {
      return NextResponse.json({ error: "Too many failed attempts. Request a new code." }, { status: 429 })
    }

    // Increment attempts
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    })

    if (otp.code !== code.trim()) {
      return NextResponse.json({ error: "Invalid code. Check and try again." }, { status: 400 })
    }

    // Mark OTP as used
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { verified: true },
    })

    // Find or create user — phoneNumber now exists in schema
    let user = await prisma.user.findFirst({
      where: { phoneNumber: normalized },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: normalized,
          phoneVerified: true,
          role: "USER",
          status: "active",
          email: `phone_${normalized.replace(/\D/g, "")}@tiky.local`,
          name: null,
        },
      })
    } else if (!user.phoneVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      })
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      role: user.role,
    })
  } catch (error) {
    console.error("verify-otp error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}