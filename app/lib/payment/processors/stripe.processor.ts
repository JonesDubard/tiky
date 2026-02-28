// import Stripe from "stripe"
// import { prisma } from "lib/prisma"
// import { PaymentRequest, PaymentResult } from "lib/payment/types"
// import { generateTicketsForOrder } from "lib/tickets/generate"

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// export class StripeProcessor {
//   async processPayment(request: PaymentRequest): Promise<PaymentResult> {
//     try {
//       const { eventId, quantities, email } = request

//       const ticketTypeIds = Object.keys(quantities)
//       if (ticketTypeIds.length === 0) {
//         return { success: false, error: "No tickets selected" }
//       }

//       const ticketTypes = await prisma.ticketType.findMany({
//         where: { id: { in: ticketTypeIds }, eventId },
//       })

//       if (ticketTypes.length === 0) {
//         return { success: false, error: "Ticket types not found" }
//       }

//       const totalAmount = ticketTypes.reduce((sum, ticketType) => {
//         const qty = quantities[ticketType.id] || 0
//         return sum + ticketType.price * qty
//       }, 0)

//       if (totalAmount <= 0) {
//         return { success: false, error: "Invalid total amount" }
//       }

//       const order = await prisma.order.create({
//   data: {
//     totalPrice: totalAmount,
//     status: "PENDING",
//     ...(email && {
//       user: {
//         connectOrCreate: {
//           where: { email },
//           create: { email },
//         },
//       },
//     }),
//   },
// })

//       const payment = await prisma.payment.create({
//         data: {
//           amount: totalAmount,
//           currency: "USD",
//           status: "PENDING",
//           paymentMethod: "card",
//           orderId: order.id,
//           eventId,
//         },
//       })

//       const paymentIntent = await stripe.paymentIntents.create({
//         amount: Math.round(totalAmount * 100),
//         currency: "usd",
//         receipt_email: email ?? undefined,
//         metadata: {
//           orderId: order.id,
//           paymentId: payment.id,
//           eventId,
//           quantities: JSON.stringify(quantities), // ✅ stored for webhook use
//         },
//       })

//       // ✅ Generate tickets immediately (sandbox/dev)
//       // In production the Stripe webhook handles this instead
//       await generateTicketsForOrder(order.id, quantities)

//       return {
//         success: true,
//         clientSecret: paymentIntent.client_secret!,
//         orderId: order.id,
//         paymentId: payment.id,
//       }
//     } catch (error: any) {
//       console.error("StripeProcessor error:", error)
//       return { success: false, error: error.message }
//     }
//   }
// }

import Stripe from "stripe"
import { prisma } from "lib/prisma"
import { PaymentRequest, PaymentResult } from "lib/payment/types"
import { generateTicketsForOrder } from "lib/tickets/generate"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export class StripeProcessor {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const { eventId, quantities, email } = request

      const ticketTypeIds = Object.keys(quantities)

      if (ticketTypeIds.length === 0) {
        return { success: false, error: "No tickets selected" }
      }

      const ticketTypes = await prisma.ticketType.findMany({
        where: {
          id: { in: ticketTypeIds },
          eventId,
        },
      })

      if (ticketTypes.length === 0) {
        return { success: false, error: "Ticket types not found" }
      }

      const totalAmount = ticketTypes.reduce((sum, ticketType) => {
        const qty = quantities[ticketType.id] || 0
        return sum + ticketType.price * qty
      }, 0)

      if (totalAmount <= 0) {
        return { success: false, error: "Invalid total amount" }
      }

      // ✅ Create Order
      const order = await prisma.order.create({
  data: {
    totalPrice: totalAmount,
    status: "PENDING",

    // ✅ THIS IS THE FIX
    event: {
      connect: { id: eventId }
    },

    ...(email && {
      user: {
        connectOrCreate: {
          where: { email },
          create: { email },
        },
      },
    }),
  },
})

      // ✅ Create Payment record
      const payment = await prisma.payment.create({
        data: {
          amount: totalAmount,
          currency: "USD",
          status: "PENDING",
          paymentMethod: "card",
          orderId: order.id,
          eventId,
        },
      })

      // ✅ Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: "usd",
        receipt_email: email ?? undefined,
        metadata: {
          orderId: order.id,
          paymentId: payment.id,
          eventId,
          quantities: JSON.stringify(quantities),
        },
      })

      // 🚫 DO NOT generate tickets here
      // Tickets should only be generated after successful confirmation
      // This will later move to Stripe webhook

      return {
  success: true,
  paymentIntent,
  clientSecret: paymentIntent.client_secret!, // optional but safe
  orderId: order.id,
  paymentId: payment.id,
}
    } catch (error: any) {
      console.error("StripeProcessor error:", error)
      return { success: false, error: error.message }
    }
  }
}