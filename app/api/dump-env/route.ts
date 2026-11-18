import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    orangeOauthBasic: process.env.ORANGE_OAUTH_BASIC,
    orangeBaseUrl: process.env.ORANGE_BASE_URL,
    orangeOauthUrl: process.env.ORANGE_OAUTH_URL,
    orangeContractRef: process.env.ORANGE_OM_CONTRACT_REF ?? process.env.ORANGE_CONTRACT_REF,
    orangeCountry: process.env.ORANGE_COUNTRY,
    orangeCurrency: process.env.ORANGE_CURRENCY,
    orangeCallbackUser: process.env.ORANGE_CALLBACK_USER,
    orangeCallbackPass: process.env.ORANGE_CALLBACK_PASS,
  });
}