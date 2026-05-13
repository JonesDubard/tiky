// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

// ── Validate env vars at module load time so you get a clear error ─────────
if (!process.env.RESEND_API_KEY) {
  console.error("[FORGOT_PASSWORD] RESEND_API_KEY is not set");
}
if (!process.env.NEXTAUTH_URL) {
  console.error("[FORGOT_PASSWORD] NEXTAUTH_URL is not set");
}

const resend  = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = (process.env.NEXTAUTH_URL || "https://www.tikylr.com").replace(/\/$/, "");
const TOKEN_EXPIRY_MINUTES = 60;
const IS_DEV = process.env.NODE_ENV === "development";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export async function POST(req: Request) {
  // Always return this to prevent email enumeration attacks
  const genericOk = NextResponse.json({
    message: "If an account with that email exists, a reset link has been sent.",
  });

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || !isValidEmail(email)) return genericOk;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    // Return generic even if user doesn't exist — prevents enumeration
    if (!user) return genericOk;

    // Invalidate all existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, usedAt: null },
      data:  { usedAt: new Date() },
    });

    // Create a new token
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, email: normalizedEmail, expiresAt },
    });

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

    // ── Send the email ──────────────────────────────────────────────────────
    const { data: emailData, error: emailError } = await resend.emails.send({
      from:    "Tiky <noreply@tikylr.com>",
      to:      normalizedEmail,
      subject: "Reset your Tiky password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#f97316;">Reset your password</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset the password for your Tiky account.</p>
          <p>Click the button below to set a new password. This link expires in
             <strong>${TOKEN_EXPIRY_MINUTES} minutes</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:16px 0;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
          <p>Or copy this link into your browser:</p>
          <p style="word-break:break-all;color:#555;font-size:13px;">${resetUrl}</p>
          <p style="color:#888;font-size:13px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#aaa;font-size:12px;">Tiky · Monrovia, Liberia</p>
        </div>
      `,
    });

    // ── Surface real error in dev, log it in prod ───────────────────────────
    if (emailError) {
      console.error("[FORGOT_PASSWORD] Resend error:", JSON.stringify(emailError, null, 2));
      console.error("[FORGOT_PASSWORD] Attempted to send to:", normalizedEmail);
      console.error("[FORGOT_PASSWORD] Reset URL was:", resetUrl);

      if (IS_DEV) {
        // In development, return the actual error so you can debug
        return NextResponse.json(
          { error: `Email failed: ${emailError.message}`, resetUrl },
          { status: 500 }
        );
      }
      // In production, return generic to avoid leaking details
      return genericOk;
    }

    if (IS_DEV) {
      // Log the reset URL in dev so you can test without email
      console.log("[FORGOT_PASSWORD] Reset URL (dev):", resetUrl);
    }

    return genericOk;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[FORGOT_PASSWORD] Unexpected error:", message);

    if (IS_DEV) {
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}