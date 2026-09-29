import { createServerFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
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
    const requestedIds = [...new Set(data.items.map((item) => item.variantId))];

    const variants = await db
      .select({
        variantId: productVariants.id,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productStatus: products.status,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stock: productVariants.stock,
        productPriceKobo: products.priceKobo,
        variantPriceKobo: productVariants.priceKobo,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(inArray(productVariants.id, requestedIds));

    if (variants.length !== requestedIds.length) {
      throw new Error("One or more cart items no longer exist");
    }

    const normalizedItems = data.items.map((requested) => {
      const variant = variants.find(
        (entry) => entry.variantId === requested.variantId,
      );

      if (!variant || variant.productStatus !== "active") {
        throw new Error("One or more products are unavailable");
      }

      if (variant.stock < requested.quantity) {
        throw new Error(
          `${variant.productName} in size ${variant.size} only has ${variant.stock} remaining`,
        );
      }

      const unitPriceKobo =
        variant.variantPriceKobo ?? variant.productPriceKobo;

      return {
        ...variant,
        quantity: requested.quantity,
        unitPriceKobo,
        lineTotalKobo: unitPriceKobo * requested.quantity,
      };
    });

    const subtotalKobo = normalizedItems.reduce(
      (total, item) => total + item.lineTotalKobo,
      0,
    );

    const shippingKobo = Number(process.env.FLAT_SHIPPING_FEE_KOBO ?? 250_000);

    const totalKobo = subtotalKobo + shippingKobo;
    const orderNumber = createOrderNumber();
    const paymentReference = createPaymentReference();

    const created = await db.transaction(async (tx) => {
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
      await db
        .update(payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(payments.reference, paymentReference));

      throw error;
    }
  });
