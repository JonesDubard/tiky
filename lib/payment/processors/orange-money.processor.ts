import { prisma } from "lib/prisma";
import { PaymentRequest, PaymentResult } from "lib/payment/types";

export class OrangeMoneyProcessor {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const { eventId, quantities, phoneNumber } = request;

      // ✅ Validate phone number
      if (!phoneNumber) {
        return { success: false, error: "Phone number required for Orange Money" };
      }

      const ticketTypeIds = Object.keys(quantities);

      if (ticketTypeIds.length === 0) {
        return { success: false, error: "No tickets selected" };
      }

      // ✅ Fetch all selected ticket types
      const ticketTypes = await prisma.ticketType.findMany({
        where: {
          id: { in: ticketTypeIds },
          eventId,
        },
      });

      if (ticketTypes.length === 0) {
        return { success: false, error: "Ticket types not found" };
      }

      // ✅ Calculate total across all selected ticket types
      const totalAmount = ticketTypes.reduce((sum, ticketType) => {
        const qty = quantities[ticketType.id] || 0;
        return sum + ticketType.price * qty;
      }, 0);

      if (totalAmount <= 0) {
        return { success: false, error: "Invalid total amount" };
      }

      const order = await prisma.order.create({
        data: {
          totalPrice: totalAmount,
          status: "PENDING",
        },
      });

      const payment = await prisma.payment.create({
        data: {
          amount: totalAmount,
          currency: "USD",
          status: "COMPLETED", // simulated
          paymentMethod: "orange_money",
          orderId: order.id,
          eventId,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      });

      return {
        success: true,
        redirectUrl: `/checkout/success?orderId=${order.id}`,
        orderId: order.id,
        paymentId: payment.id,
      };
    } catch (error: any) {
      console.error("OrangeMoneyProcessor error:", error);
      return { success: false, error: error.message };
    }
  }
}