// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import crypto from "crypto"
import { Resend } from "resend" 

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || "http://www.tikylr.com"
const TOKEN_EXPIRY_MINUTES = 60

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    // Always return the same response to prevent email enumeration
    const genericResponse = NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    })

    if (!email || !isValidEmail(email)) return genericResponse

    const normalizedEmail = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

    // Return generic response even if user not found
    if (!user) return genericResponse

    // Invalidate any existing unused tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, usedAt: null },
      data: { usedAt: new Date() },
    })

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { token, email: normalizedEmail, expiresAt },
    })

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`

    await resend.emails.send({
      from: "Tiky <noreply@tikylr.com>", 
      to: normalizedEmail,
      subject: "Reset your Tiky password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#1E96C8;">Reset your password</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset the password for your Tiky account.</p>
          <p>Click the button below to set a new password. This link expires in <strong>${TOKEN_EXPIRY_MINUTES} minutes</strong>.</p>
          <a href="${resetUrl}"
            style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1E96C8;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
          <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#aaa;font-size:12px;">Tiky · Brewerville, Liberia</p>
        </div>
      `,
    })

    return genericResponse
  } catch (err) {
    console.error("[FORGOT_PASSWORD]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}