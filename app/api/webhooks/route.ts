// app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "lib/prisma";
import { generateQRCode } from "@/lib/payment/utils";
import { generatePDF } from "@/lib/payment/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-08-16" });

export async function POST(req: Request) {
  const buf = await req.arrayBuffer();
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err);
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const paymentId = pi.metadata.paymentId;

    // Update Payment
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "success", transactionId: pi.id },
    });

    // Generate Ticket
    const qrCode = await generateQRCode(`ticket-${pi.id}`);
    const ticket = await prisma.ticket.create({
      data: {
        paymentId: payment.id,
        eventId: payment.eventId,
        qrCode,
      },
    });

    const pdfUrl = await generatePDF(ticket);

    // Update ticket with PDF URL
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { pdfUrl },
    });

    // TODO: Send email to payment.email with pdfUrl
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}