import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl = process.env.MOMO_BASE_URL ?? "https://proxy.momoapi.mtn.com";
    const environment = process.env.MOMO_ENV ?? "mtnliberia";
    const res = await fetch(`${baseUrl}/collection/token/`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.MOMO_API_USER_ID}:${process.env.MOMO_API_KEY}`
          ).toString("base64"),
        "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY!,
        "X-Target-Environment": environment,
      },
    });
    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}