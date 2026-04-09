import { NextRequest, NextResponse } from "next/server"
import { prisma } from "lib/prisma"
import { createClient } from "@supabase/supabase-js"

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"]
const STORAGE_BUCKET = "payment-proofs"

// Helper to get Supabase client (lazy initialization)
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables")
    }
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, referenceCode: true, proofUrl: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const allowedStatuses = ["PENDING_CONFIRMATION", "REJECTED", "AWAITING_APPROVAL"]
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: "This order cannot accept proof uploads" },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("proof") as File | null
    const proofNote = formData.get("proofNote") as string | null

    if (!file && !proofNote) {
      return NextResponse.json(
        { error: "Please upload a screenshot or enter a transaction ID" },
        { status: 400 }
      )
    }

    let proofUrl: string | null = order.proofUrl ?? null

    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type. Allowed: JPG, PNG, WebP` },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB` },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.type.split("/")[1].replace("jpeg", "jpg")
      const filePath = `${orderId}/${Date.now()}.${ext}`

      const supabase = getSupabaseClient()
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, { contentType: file.type, upsert: true })

      if (uploadError) {
        console.error("[UPLOAD PROOF] Supabase storage error:", uploadError)
        return NextResponse.json(
          { error: "Failed to upload file. Please try again." },
          { status: 500 }
        )
      }

      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
      proofUrl = urlData.publicUrl
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        proofUrl: proofUrl ?? undefined,
        proofNote: proofNote?.trim() ?? undefined,
        status: "AWAITING_APPROVAL",
      },
    })

    console.log(`[UPLOAD PROOF] Order ${orderId} (${order.referenceCode}) submitted proof. Status → AWAITING_APPROVAL`)

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