// app/api/orders/[id]/upload-proof/route.ts
//
// Accepts a proof of payment (screenshot or transaction ID note).
// Saves file to Supabase Storage, updates Order with proofUrl + proofNote.
// Changes order status from PENDING_CONFIRMATION → AWAITING_APPROVAL.

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { createClient } from "@supabase/supabase-js"

// Use the service role key for server-side storage operations
// This bypasses RLS — keep this key server-side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"]
const STORAGE_BUCKET = "payment-proofs" // Create this bucket in Supabase dashboard

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // ── Verify order exists and is in the right state ─────────────────────────
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        referenceCode: true,
        proofUrl: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Allow re-submission if previously rejected
    const allowedStatuses = ["PENDING_CONFIRMATION", "REJECTED", "AWAITING_APPROVAL"]
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: "This order cannot accept proof uploads" },
        { status: 400 }
      )
    }

    // ── Parse multipart form data ─────────────────────────────────────────────
    const formData = await req.formData()
    const file = formData.get("proof") as File | null
    const proofNote = formData.get("proofNote") as string | null // Optional transaction ID

    if (!file && !proofNote) {
      return NextResponse.json(
        { error: "Please upload a screenshot or enter a transaction ID" },
        { status: 400 }
      )
    }

    let proofUrl: string | null = order.proofUrl ?? null

    // ── Upload file to Supabase Storage ───────────────────────────────────────
    if (file) {
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type. Allowed: JPG, PNG, WebP` },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Path: payment-proofs/{orderId}/{timestamp}.{ext}
      const ext = file.type.split("/")[1].replace("jpeg", "jpg")
      const filePath = `${orderId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true, // Allow re-upload if user resubmits
        })

      if (uploadError) {
        console.error("[UPLOAD PROOF] Supabase storage error:", uploadError)
        return NextResponse.json(
          { error: "Failed to upload file. Please try again." },
          { status: 500 }
        )
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      proofUrl = urlData.publicUrl
    }

    // ── Update order in database ──────────────────────────────────────────────
    await prisma.order.update({
      where: { id: orderId },
      data: {
        proofUrl: proofUrl ?? undefined,
        proofNote: proofNote?.trim() ?? undefined,
        status: "AWAITING_APPROVAL",
      },
    })

    console.log(
      `[UPLOAD PROOF] Order ${orderId} (${order.referenceCode}) submitted proof. Status → AWAITING_APPROVAL`
    )

    return NextResponse.json({
      success: true,
      message: "Proof submitted. We will verify and confirm your tickets shortly.",
    })
  } catch (error) {
    console.error("[UPLOAD PROOF] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}