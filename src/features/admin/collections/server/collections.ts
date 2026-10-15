import { createServerFn } from "@tanstack/react-start";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { collections, productCollections, products } from "#/db/schema";
import { getAdminSession } from "#/lib/auth.functions";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only.",
  );

const collectionSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: slugSchema,
  description: z.string().trim().max(2_000),
  published: z.boolean(),
  archived: z.boolean(),
});

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export const getAdminProductCollections = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      productId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [allCollections, assignedRows] = await Promise.all([
      db
        .select()
        .from(collections)
        .where(eq(collections.archived, false))
        .orderBy(asc(collections.name)),

      db
        .select({
          collectionId: productCollections.collectionId,
        })
        .from(productCollections)
        .where(eq(productCollections.productId, data.productId)),
    ]);

    return {
      collections: allCollections,
      selectedCollectionIds: assignedRows.map((row) => row.collectionId),
    };
  });

export const updateAdminProductCollections = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      productId: z.uuid(),
      collectionIds: z.array(z.uuid()).max(20),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const uniqueCollectionIds = [...new Set(data.collectionIds)];

    return db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, data.productId))
        .limit(1);

      if (!product) {
        throw new Error("Product not found.");
      }

      await tx
        .delete(productCollections)
        .where(eq(productCollections.productId, data.productId));

      if (uniqueCollectionIds.length > 0) {
        await tx.insert(productCollections).values(
          uniqueCollectionIds.map((collectionId) => ({
            productId: data.productId,
            collectionId,
          })),
        );
      }

      const savedRows = await tx
        .select({
          collectionId: productCollections.collectionId,
        })
        .from(productCollections)
        .where(eq(productCollections.productId, data.productId));

      return {
        selectedCollectionIds: savedRows.map((row) => row.collectionId),
      };
    });
  });

export const getAdminCollections = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();

  return db
    .select()
    .from(collections)
    .orderBy(desc(collections.publishedAt), asc(collections.name));
});

export const createAdminCollection = createServerFn({
  method: "POST",
})
  .validator(
    collectionSchema.omit({
      archived: true,
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [collection] = await db
      .insert(collections)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description,
        archived: false,
        publishedAt: data.published ? new Date() : null,
      })
      .returning();

    return collection;
  });

export const updateAdminCollection = createServerFn({
  method: "POST",
})
  .validator(
    collectionSchema.extend({
      collectionId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [collection] = await db
      .update(collections)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        archived: data.archived,
        publishedAt: data.archived || !data.published ? null : new Date(),
      })
      .where(eq(collections.id, data.collectionId))
      .returning();

    if (!collection) {
      throw new Error("Collection not found.");
    }

    return collection;
  });
