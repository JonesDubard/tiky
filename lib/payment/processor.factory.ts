import { StripeProcessor } from "@/lib/payment/processors/stripe.processor";
import { MTNMoMoProcessor } from "lib/payment/processors/mtn-momo.processor";
import { OrangeMoneyProcessor } from "lib/payment/processors/orange-money.processor";
import { PaymentMethod } from "lib/payment/types";

export function getProcessor(method: PaymentMethod) {
  switch (method) {
    case "card":
      return new StripeProcessor();
    case "mtn_momo":
      return new MTNMoMoProcessor();
    case "orange_money":
      return new OrangeMoneyProcessor();
    default:
      throw new Error("Unsupported payment method");
  }
}