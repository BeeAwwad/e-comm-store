import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { getAdminSession } from "#/lib/auth.functions";
import { categories, productCategories, products } from "#/db/schema";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only.",
  );

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
});

export const getAdminProductCategories = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      productId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [allCategories, assignedRows] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.name)),
      db
        .select({
          categoryId: productCategories.categoryId,
        })
        .from(productCategories)
        .where(eq(productCategories.productId, data.productId)),
    ]);

    return {
      categories: allCategories,
      selectedCategoryIds: assignedRows.map((row) => row.categoryId),
    };
  });

export const updateAdminProductCategories = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      productId: z.uuid(),
      categoryIds: z.array(z.uuid()).max(20),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const uniqueCategoryIds = [...new Set(data.categoryIds)];

    await db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, data.productId))
        .limit(1);

      if (!product) {
        throw new Error("Product not found.");
      }

      await tx
        .delete(productCategories)
        .where(eq(productCategories.productId, data.productId));

      if (uniqueCategoryIds.length > 0) {
        await tx.insert(productCategories).values(
          uniqueCategoryIds.map((categoryId) => ({
            productId: data.productId,
            categoryId,
          })),
        );
      }
    });

    return { success: true };
  });

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }
}

export const getAdminCategories = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();

  return db.select().from(categories).orderBy(asc(categories.name));
});

export const createAdminCategory = createServerFn({
  method: "POST",
})
  .validator(categorySchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const [category] = await db
      .insert(categories)
      .values({
        name: data.name,
        slug: data.slug,
      })
      .returning();

    return category;
  });

export const updateAdminCategory = createServerFn({
  method: "POST",
})
  .validator(
    categorySchema.extend({
      categoryId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [category] = await db
      .update(categories)
      .set({
        name: data.name,
        slug: data.slug,
      })
      .where(eq(categories.id, data.categoryId))
      .returning();

    if (!category) {
      throw new Error("Category not found.");
    }

    return category;
  });

export const deleteAdminCategory = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      categoryId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    await db.delete(categories).where(eq(categories.id, data.categoryId));

    return { success: true };
  });
