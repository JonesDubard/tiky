import { NextResponse } from "next/server";

export async function GET() {
  // Only allow this in development or preview, never production
  return NextResponse.json({
    momoKey: process.env.MOMO_SUBSCRIPTION_KEY,
    momoUser: process.env.MOMO_API_USER_ID,
    // Add any other keys you need to retrieve
  });
}