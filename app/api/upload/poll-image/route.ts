// // app/api/upload/poll-image/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { getServerSession } from "next-auth"
// import { authOptions } from "lib/auth"
// import { put } from "@vercel/blob"

// const MAX_SIZE = 5 * 1024 * 1024 // 5MB
// const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions)
//     if (!session?.user?.email) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const formData = await req.formData()
//     const file = formData.get("file") as File | null

//     if (!file) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 })
//     }

//     if (!ALLOWED_TYPES.includes(file.type)) {
//       return NextResponse.json(
//         { error: "Invalid file type. Use JPEG, PNG, or WebP." },
//         { status: 400 }
//       )
//     }

//     if (file.size > MAX_SIZE) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 5MB." },
//         { status: 400 }
//       )
//     }

//     const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
//     const filename = `polls/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

//     const blob = await put(filename, file, {
//       access: "public",
//       contentType: file.type,
//     })

//     return NextResponse.json({ url: blob.url }, { status: 201 })

//   } catch (error: unknown) {
//     console.error("Upload error:", error)
//     return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
//   }
// }

// app/api/upload/poll-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // ── Compress with Sharp ──────────────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const resizedBuffer = await sharp(buffer)
      .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `polls/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

    const blob = await put(filename, resizedBuffer, {
      access: "public",
      contentType: "image/webp",
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POLL_IMAGE_UPLOAD]", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}