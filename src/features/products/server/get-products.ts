import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, exists, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db";
import {
  categories,
  collections,
  productCategories,
  productCollections,
  productImages,
  productVariants,
  products,
} from "../../../db/schema";

const productFiltersSchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  category: z.string().trim().max(100).optional().default(""),
  collection: z.string().trim().max(100).optional().default(""),
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

    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceKobo: products.priceKobo,
        featured: products.featured,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),

          data.search ? ilike(products.name, `%${data.search}%`) : undefined,

          data.category
            ? exists(
                db
                  .select({ productId: productCategories.productId })
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

          data.collection
            ? exists(
                db
                  .select({ productId: productCollections.productId })
                  .from(productCollections)
                  .innerJoin(
                    collections,
                    eq(collections.id, productCollections.collectionId),
                  )
                  .where(
                    and(
                      eq(productCollections.productId, products.id),
                      eq(collections.slug, data.collection),
                      eq(collections.archived, false),
                    ),
                  ),
              )
            : undefined,
        ),
      )
      .orderBy(orderBy, desc(products.createdAt));

    if (productRows.length === 0) {
      return [];
    }

    const productIds = productRows.map((product) => product.id);

    const [images, variants] = await Promise.all([
      db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          position: productImages.position,
        })
        .from(productImages)
        .where(inArray(productImages.productId, productIds))
        .orderBy(asc(productImages.position)),

      db
        .select({
          productId: productVariants.productId,
          stock: productVariants.stock,
          reservedStock: productVariants.reservedStock,
        })
        .from(productVariants)
        .where(
          and(
            inArray(productVariants.productId, productIds),
            eq(productVariants.active, true),
          ),
        ),
    ]);

    return productRows.map((product) => {
      const productImagesForProduct = images.filter(
        (image) => image.productId === product.id,
      );

      const productVariantsForProduct = variants.filter(
        (variant) => variant.productId === product.id,
      );

      const totalStock = productVariantsForProduct.reduce(
        (total, variant) =>
          total + Math.max(variant.stock - (variant.reservedStock ?? 0), 0),
        0,
      );

      return {
        ...product,
        imageUrl: productImagesForProduct[0]?.url ?? null,
        totalStock,
      };
    });
  });
