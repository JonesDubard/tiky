import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://proxy.momoapi.mtn.com/collection/token/", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${process.env.MOMO_API_USER_ID}:${process.env.MOMO_API_KEY}`).toString("base64"),
        "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY!,
      },
    });
    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}