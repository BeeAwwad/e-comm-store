import { and, eq, sql } from "drizzle-orm";
import { db } from "#/db";
import { orderItems, orders, payments, productVariants } from "#/db/schema";
import type { PaystackVerification } from "#/lib/paystack";
import { sendOrderEmail } from "#/features/emails/server/send-order-email";

export async function completePayment(
  paymentData: PaystackVerification["data"],
) {
  const result = db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.reference, paymentData.reference))
      .for("update");

    if (!payment) {
      throw new Error("Payment reference does not exist");
    }

    if (payment.status === "success") {
      return {
        orderId: payment.orderId,
        alreadyProcessed: true,
      };
    }

    if (
      paymentData.status !== "success" ||
      paymentData.amount !== payment.amountKobo ||
      paymentData.currency !== payment.currency
    ) {
      await tx
        .update(payments)
        .set({
          status: "failed",
          rawResponse: JSON.stringify(paymentData),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      throw new Error("Payment verification did not match order");
    }

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, payment.orderId));

    for (const item of items) {
      const [updatedVariant] = await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} - ${item.quantity}`,
        })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            sql`${productVariants.stock} >= ${item.quantity}`,
          ),
        )
        .returning({
          id: productVariants.id,
        });

      if (!updatedVariant) {
        throw new Error(`Insufficient inventory for SKU ${item.sku}`);
      }
    }

    await tx
      .update(payments)
      .set({
        status: "success",
        providerTransactionId: String(paymentData.id),
        channel: paymentData.channel,
        rawResponse: JSON.stringify(paymentData),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await tx
      .update(orders)
      .set({
        status: "paid",
        paidAt: paymentData.paid_at
          ? new Date(paymentData.paid_at)
          : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, payment.orderId));

    return {
      orderId: payment.orderId,
      alreadyProcessed: false,
    };
  });

  if (!(await result).alreadyProcessed) {
    try {
      await sendOrderEmail({
        orderId: (await result).orderId,
        type: "payment_confirmation",
      });
    } catch (error) {
      console.error("Could not send payment confirmation email", error);
    }
  }
}
