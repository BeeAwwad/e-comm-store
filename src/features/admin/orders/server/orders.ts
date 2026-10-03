import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { sendOrderEmail } from "#/features/emails/server/send-order-email";
import { db } from "#/db";
import { orderItems, orders, payments } from "#/db/schema";
import { getAdminSession } from "#/lib/auth.functions";

const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export const getAdminOrders = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();

  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      email: orders.email,
      firstName: orders.firstName,
      lastName: orders.lastName,
      totalKobo: orders.totalKobo,
      currency: orders.currency,
      status: orders.status,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      courier: orders.courier,
      trackingNumber: orders.trackingNumber,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt));
});

export const getAdminOrder = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      orderId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!order) {
      return null;
    }

    const [items, paymentRows] = await Promise.all([
      db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .orderBy(asc(orderItems.productName)),

      db
        .select({
          id: payments.id,
          provider: payments.provider,
          reference: payments.reference,
          status: payments.status,
          amountKobo: payments.amountKobo,
          currency: payments.currency,
          providerTransactionId: payments.providerTransactionId,
          channel: payments.channel,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.orderId, order.id))
        .orderBy(desc(payments.createdAt)),
    ]);

    return {
      order,
      items,
      payments: paymentRows,
    };
  });

export const updateAdminOrderFulfillment = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      orderId: z.uuid(),
      status: orderStatusSchema,
      courier: z.string().trim().max(100).nullable(),
      trackingNumber: z.string().trim().max(200).nullable(),
      adminNotes: z.string().trim().max(5_000).nullable(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
    });

    if (!currentOrder) {
      throw new Error("Order not found");
    }

    const allowedTransitions: Record<
      typeof currentOrder.status,
      Array<typeof currentOrder.status>
    > = {
      pending: ["cancelled"],
      paid: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const changingStatus = currentOrder.status !== data.status;

    if (
      changingStatus &&
      !allowedTransitions[currentOrder.status].includes(data.status)
    ) {
      throw new Error(
        `Cannot change a ${currentOrder.status} order to ${data.status}.`,
      );
    }

    const updateData: Partial<typeof orders.$inferInsert> = {
      status: data.status,
      courier: data.courier || null,
      trackingNumber: data.trackingNumber || null,
      adminNotes: data.adminNotes || null,
      updatedAt: new Date(),
    };

    if (data.status === "shipped" && !currentOrder.shippedAt) {
      updateData.shippedAt = new Date();
    }

    if (data.status === "delivered" && !currentOrder.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, currentOrder.id))
      .returning();

    if (changingStatus && data.status === "shipped") {
      try {
        await sendOrderEmail({
          orderId: updatedOrder.id,
          type: "shipment_confirmation",
        });
      } catch (error) {
        console.error("Could not send shipment confirmation email", error);
      }
    }

    if (changingStatus && data.status === "delivered") {
      try {
        await sendOrderEmail({
          orderId: updatedOrder.id,
          type: "delivery_confirmation",
        });
      } catch (error) {
        console.error("Could not send delivered confirmation email", error);
      }
    }
    return updatedOrder;
  });
