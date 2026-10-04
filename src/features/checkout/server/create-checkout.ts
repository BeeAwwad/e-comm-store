import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import {
  orderItems,
  orders,
  payments,
  products,
  productVariants,
} from "#/db/schema";
import { createOrderNumber, createPaymentReference } from "#/lib/order-number";
import { initializePaystackTransaction } from "#/lib/paystack";
import { releaseInventoryReservation } from "#/features/inventory/server/reservations";

const checkoutSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  addressLine1: z.string().trim().min(5).max(250),
  addressLine2: z.string().trim().max(250).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
});

export const createCheckout = createServerFn({
  method: "POST",
})
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    /*
     * A customer could theoretically have the same variant twice in their
     * browser cart. Merge those rows first, so stock is checked/reserved once.
     */
    const quantityByVariantId = new Map<string, number>();

    for (const item of data.items) {
      const nextQuantity =
        (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity;

      if (nextQuantity > 10) {
        throw new Error("You can only purchase up to 10 of one item.");
      }

      quantityByVariantId.set(item.variantId, nextQuantity);
    }

    const requestedIds = [...quantityByVariantId.keys()];

    const variants = await db
      .select({
        variantId: productVariants.id,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productStatus: products.status,
        variantActive: productVariants.active,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stock: productVariants.stock,
        reservedStock: productVariants.reservedStock,
        productPriceKobo: products.priceKobo,
        variantPriceKobo: productVariants.priceKobo,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(inArray(productVariants.id, requestedIds));

    if (variants.length !== requestedIds.length) {
      throw new Error("One or more cart items no longer exist.");
    }

    const normalizedItems = requestedIds
      .map((variantId) => {
        const variant = variants.find((entry) => entry.variantId === variantId);

        const quantity = quantityByVariantId.get(variantId);

        if (!variant || !quantity) {
          throw new Error("One or more cart items are unavailable.");
        }

        if (variant.productStatus !== "active" || !variant.variantActive) {
          throw new Error(`${variant.productName} is no longer available.`);
        }

        const availableStock = variant.stock - variant.reservedStock;

        if (availableStock < quantity) {
          throw new Error(
            `${variant.productName} in size ${variant.size} only has ${Math.max(
              availableStock,
              0,
            )} remaining.`,
          );
        }

        const unitPriceKobo =
          variant.variantPriceKobo ?? variant.productPriceKobo;

        return {
          ...variant,
          quantity,
          unitPriceKobo,
          lineTotalKobo: unitPriceKobo * quantity,
        };
      })
      /*
       * All checkout requests reserve variants in the same order.
       * This reduces the chance of database deadlocks when two people
       * are checking out different combinations of products simultaneously.
       */
      .sort((first, second) => first.variantId.localeCompare(second.variantId));

    const subtotalKobo = normalizedItems.reduce(
      (total, item) => total + item.lineTotalKobo,
      0,
    );

    const shippingKobo = Number(process.env.FLAT_SHIPPING_FEE_KOBO ?? 250_000);

    const totalKobo = subtotalKobo + shippingKobo;
    const orderNumber = createOrderNumber();
    const paymentReference = createPaymentReference();

    /*
     * Twenty minutes is enough time for a normal Paystack checkout.
     * A later reconciliation job will verify expired pending payments
     * with Paystack before releasing their reservation.
     */
    const reservationExpiresAt = new Date(Date.now() + 20 * 60 * 1000);

    const created = await db.transaction(async (tx) => {
      /*
       * This is the important atomic reservation.
       *
       * Postgres only increments reserved_stock if stock - reserved_stock
       * is still enough at the exact moment this query runs.
       */
      for (const item of normalizedItems) {
        const [reservedVariant] = await tx
          .update(productVariants)
          .set({
            reservedStock: sql`${productVariants.reservedStock} + ${item.quantity}`,
          })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              eq(productVariants.active, true),
              sql`${productVariants.stock} - ${productVariants.reservedStock} >= ${item.quantity}`,
            ),
          )
          .returning({
            id: productVariants.id,
          });

        if (!reservedVariant) {
          throw new Error(
            `${item.productName} in size ${item.size} just sold out.`,
          );
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          state: data.state,
          country: data.country,
          subtotalKobo,
          shippingKobo,
          totalKobo,
          currency: "NGN",
          inventoryReserved: true,
          reservationExpiresAt,
        })
        .returning();

      await tx.insert(orderItems).values(
        normalizedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          productSlug: item.productSlug,
          sku: item.sku,
          size: item.size,
          color: item.color,
          unitPriceKobo: item.unitPriceKobo,
          quantity: item.quantity,
          lineTotalKobo: item.lineTotalKobo,
        })),
      );

      await tx.insert(payments).values({
        orderId: order.id,
        reference: paymentReference,
        amountKobo: totalKobo,
        currency: "NGN",
      });

      return order;
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    try {
      const payment = await initializePaystackTransaction({
        email: created.email,
        amountKobo: totalKobo,
        reference: paymentReference,
        orderId: created.id,
        callbackUrl: `${appUrl}/checkout/callback`,
      });

      return {
        authorizationUrl: payment.authorization_url,
        orderNumber: created.orderNumber,
      };
    } catch (error) {
      /*
       * Paystack was not initialized, so the customer cannot pay for this
       * order. Return its temporary stock reservation immediately.
       */
      try {
        await releaseInventoryReservation(paymentReference, "failed");
      } catch (releaseError) {
        console.error(
          "Could not release inventory after Paystack initialization failed",
          releaseError,
        );
      }

      throw error;
    }
  });
