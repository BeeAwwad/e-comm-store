import "@tanstack/react-start/server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "#/db";
import { orderItems, orders, payments, productVariants } from "#/db/schema";

type FailedPaymentStatus = "failed" | "abandoned" | "reversed";

export async function releaseInventoryReservation(
  reference: string,
  paymentStatus: FailedPaymentStatus,
) {
  return db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.reference, reference))
      .for("update");

    if (!payment || payment.status === "success") {
      return { released: false };
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update");

    if (!order || !order.inventoryReserved) {
      return { released: false };
    }

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      await tx
        .update(productVariants)
        .set({
          reservedStock: sql`greatest(${productVariants.reservedStock} - ${item.quantity}, 0)`,
        })
        .where(eq(productVariants.id, item.variantId));
    }

    await tx
      .update(payments)
      .set({
        status: paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await tx
      .update(orders)
      .set({
        status: "cancelled",
        inventoryReserved: false,
        reservationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return { released: true };
  });
}
