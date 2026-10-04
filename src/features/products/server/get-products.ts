import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db";
import {
  productImages,
  productVariants,
  products,
  categories,
  productCategories,
} from "../../../db/schema";
import { exists } from "drizzle-orm";

const productFiltersSchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(100).optional().default(""),
  sort: z
    .enum(["featured", "price-asc", "price-desc"])
    .optional()
    .default("featured"),
});

export const getProducts = createServerFn({ method: "GET" })
  .validator(productFiltersSchema)
  .handler(async ({ data }) => {
    const orderBy =
      data.sort === "price-asc"
        ? asc(products.priceKobo)
        : data.sort === "price-desc"
          ? desc(products.priceKobo)
          : desc(products.featured);

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceKobo: products.priceKobo,
        featured: products.featured,
        imageUrl: sql<string | null>`min(${productImages.url})`,
        totalStock: sql<number>`coalesce(sum(${productVariants.stock}), 0)`,
      })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .leftJoin(
        productVariants,
        and(
          eq(productVariants.productId, products.id),
          eq(productVariants.active, true),
        ),
      )
      .where(
        and(
          data.category
            ? exists(
                db
                  .select({ id: productCategories.productId })
                  .from(productCategories)
                  .innerJoin(
                    categories,
                    eq(categories.id, productCategories.categoryId),
                  )
                  .where(
                    and(
                      eq(productCategories.productId, products.id),
                      eq(categories.slug, data.category),
                    ),
                  ),
              )
            : undefined,
        ),
      )
      .groupBy(products.id)
      .orderBy(orderBy, desc(products.createdAt));

    return rows;
  });
