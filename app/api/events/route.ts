import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tickets: true
    }
  })

  return NextResponse.json(events)
}
