import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import twilio from "twilio"

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  // Normalize Liberian numbers: 0770123456 → +231770123456
  const normalized = phone.startsWith("+") 
    ? phone 
    : `+231${phone.replace(/^0/, "")}`

  // Rate limit: max 3 OTPs per 10 minutes
  const recentOtps = await prisma.phoneOtp.count({
    where: {
      phone: normalized,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
    }
  })
  if (recentOtps >= 3) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 10 minutes." },
      { status: 429 }
    )
  }

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 min

  await prisma.phoneOtp.create({
    data: { phone: normalized, code, expiresAt }
  })

  await client.messages.create({
    body: `Your Tiky verification code is: ${code}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: normalized,
  })

  return NextResponse.json({ success: true, message: "OTP sent" })
}