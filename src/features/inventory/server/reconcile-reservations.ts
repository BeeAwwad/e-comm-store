import "@tanstack/react-start/server-only";

import { and, eq, lte } from "drizzle-orm";
import { db } from "#/db";
import { orders, payments } from "#/db/schema";
import { completePayment } from "#/features/payment/server/complete-payment";
import { verifyPaystackTransaction } from "#/lib/paystack";
import { releaseInventoryReservation } from "./reservations";

export async function reconcileExpiredReservations() {
  const expiredReservations = await db
    .select({
      reference: payments.reference,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.status, "pending"),
        eq(orders.status, "pending"),
        eq(orders.inventoryReserved, true),
        lte(orders.reservationExpiresAt, new Date()),
      ),
    )
    .limit(50);

  const summary = {
    checked: expiredReservations.length,
    completed: 0,
    released: 0,
    stillPending: 0,
    errors: 0,
  };

  for (const reservation of expiredReservations) {
    try {
      const paymentData = await verifyPaystackTransaction(
        reservation.reference,
      );

      if (paymentData.status === "success") {
        await completePayment(paymentData);
        summary.completed += 1;
        continue;
      }

      if (
        paymentData.status === "failed" ||
        paymentData.status === "abandoned" ||
        paymentData.status === "reversed"
      ) {
        const result = await releaseInventoryReservation(
          reservation.reference,
          paymentData.status,
        );

        if (result.released) {
          summary.released += 1;
        }

        continue;
      }

      summary.stillPending += 1;
    } catch (error) {
      summary.errors += 1;
      console.error(
        `Could not reconcile Paystack payment ${reservation.reference}`,
        error,
      );
    }
  }

  return summary;
}
