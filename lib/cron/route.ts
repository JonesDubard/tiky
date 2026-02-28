import { cleanupExpiredReservations } from "lib/workers/reservation-cleanup"
import { NextResponse } from "next/server"

export async function GET() {
  await cleanupExpiredReservations()
  return NextResponse.json({ success: true })
}
