// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import bcrypt from "bcryptjs"

const MIN_LENGTH = 8

function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < MIN_LENGTH)
    return { valid: false, reason: `Password must be at least ${MIN_LENGTH} characters.` }
  if (!/[A-Z]/.test(password))
    return { valid: false, reason: "Password must include at least one uppercase letter." }
  if (!/[a-z]/.test(password))
    return { valid: false, reason: "Password must include at least one lowercase letter." }
  if (!/[0-9]/.test(password))
    return { valid: false, reason: "Password must include at least one number." }
  if (!/[^A-Za-z0-9]/.test(password))
    return { valid: false, reason: "Password must include at least one special character." }
  return { valid: true }
}

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password)
      return NextResponse.json({ error: "Token and password are required." }, { status: 400 })

    const strength = isStrongPassword(password)
    if (!strength.valid)
      return NextResponse.json({ error: strength.reason }, { status: 400 })

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken)
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 })

    if (resetToken.usedAt)
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 })

    if (new Date() > resetToken.expiresAt)
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: "Password updated successfully." })
  } catch (err) {
    console.error("[RESET_PASSWORD]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}