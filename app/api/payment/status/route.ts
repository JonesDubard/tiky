import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");

  // Simulate success after short delay
  return NextResponse.json({ status: "success", ref });
}
