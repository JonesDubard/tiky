// import { prisma } from "lib/prisma"
// import { NextResponse } from "next/server"
// import { nanoid } from "nanoid"
// import QRCode from "qrcode"


// export async function POST(req: Request) {
//   const body = await req.json()
//   const { referenceId, status } = body

//   const payment = await prisma.payment.findUnique({
//     where: { providerRef: referenceId },
//     include: { order: true },
//   })

//   if (!payment) {
//     return NextResponse.json({ error: "Not found" }, { status: 404 })
//   }

//   // Idempotency check
//   if (payment.status === "COMPLETED") {
//     return NextResponse.json({ success: true })
//   }

//   if (status !== "SUCCESSFUL") {
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: { status: "FAILED" },
//     })
//     return NextResponse.json({ success: true })
//   }

//   // START TRANSACTION HERE
//   try {
//     await prisma.$transaction(async (tx) => {
//       // 1️⃣ Get reservations
//       const reservations = await tx.ticketReservation.findMany({
//         where: { orderId: payment.orderId! },
//       })

//       // 2️⃣ Convert reservations → Tickets
//       // for (const reservation of reservations) {
//       //   for (let i = 0; i < reservation.quantity; i++) {
//       //     await tx.ticketInstance.create({
//       //       data: {
//       //         ticketTypeId: reservation.ticketTypeId,
//       //         status: "PAID",
//       //         qrCode: nanoid(),
//       //         orderId: payment.orderId!,
//       //       },
//       //     })
//       //   }
//       // }
//       // 2️⃣ Convert reservations → Tickets
// for (const reservation of reservations) {
//   for (let i = 0; i < reservation.quantity; i++) {
//     const qrCodeData = nanoid(); // Generate the unique ID first
    
//     // Generate the QR Image URL from the ID
//     const qrImage = await QRCode.toDataURL(qrCodeData);

//     await tx.ticketInstance.create({
//       data: {
//         ticketTypeId: reservation.ticketTypeId,
//         status: "PAID",
//         qrCode: qrCodeData,
//         qrImage: qrImage, 
//         orderId: payment.orderId!,
//       },
//     })
//   }
// }

//       // 3️⃣ Update Order status
//       await tx.order.update({
//         where: { id: payment.orderId! },
//         data: { status: "COMPLETED" },
//       })

//       // 4️⃣ Update Payment status
//       await tx.payment.update({
//         where: { id: payment.id },
//         data: {
//           status: "COMPLETED",
//           processedAt: new Date(),
//         },
//       })
//     })

//     return NextResponse.json({ success: true })
    
//   } catch (error) {
//     console.error("Transaction failed:", error)
//     return NextResponse.json({ error: "Processing failed" }, { status: 500 })
//   }
// }

// app/api/webhooks/mtn-momo/route.ts

import { prisma } from "lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { referenceId, status } = body

    if (!referenceId) {
      return NextResponse.json({ error: "Missing referenceId" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { providerRef: referenceId },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Idempotency
    if (payment.status === "COMPLETED") {
      return NextResponse.json({ success: true })
    }

    // FAILED case
    if (status !== "SUCCESSFUL") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      })

      return NextResponse.json({ success: true })
    }

    // SUCCESSFUL → just mark payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
      },
    })

    console.log(`[WEBHOOK] Payment marked COMPLETED: ${referenceId}`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[WEBHOOK ERROR]", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}