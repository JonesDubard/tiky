// import { NextResponse } from "next/server"
// import { z } from "zod"
// import { requestToPay } from "lib/momo-client"

// const schema = z.object({
//   phone: z.string().min(10),
//   amount: z.number().positive(),
// })

// const mockDB = new Map()

// export async function POST(req: Request) {
//   const body = await req.json()
//   const parsed = schema.safeParse(body)

//   if (!parsed.success) {
//     return NextResponse.json(
//       { error: "Invalid input" },
//       { status: 400 }
//     )
//   }

//   const { phone, amount } = parsed.data

//   const externalId = crypto.randomUUID()

//   const referenceId = await requestToPay({
//     amount,
//     currency: "EUR",
//     phone,
//     externalId,
//   })

//   mockDB.set(referenceId, {
//     status: "PENDING",
//     phone,
//     amount,
//   })

//   return NextResponse.json({
//     referenceId,
//     status: "PENDING",
//   })
// }
