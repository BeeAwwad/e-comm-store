import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { productImages, products, productVariants } from "#/db/schema";

const inputSchema = z.object({
  slug: z.string().min(1).max(200),
});

export const getProduct = createServerFn({ method: "GET" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, data.slug), eq(products.status, "active")),
    });

    if (!product) {
      return null;
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.position));

    const variants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, product.id),
          eq(productVariants.active, true),
        ),
      )
      .orderBy(asc(productVariants.size));

    return {
      ...product,
      images,
      variants: variants.map((variant) => ({
        ...variant,
        availableStock: Math.max(variant.stock - variant.reservedStock, 0),
      })),
    };
  });
