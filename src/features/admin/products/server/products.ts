import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { productImages, products, productVariants } from "#/db/schema";
import { getAdminSession } from "#/lib/auth.functions";
import { createHash } from "crypto";

const productStatusSchema = z.enum(["draft", "active", "archived"]);

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only.",
  );

const variantSchema = z.object({
  sku: z.string().trim().min(2).max(100),
  size: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(80),
  stock: z.number().int().min(0).max(100_000),
  priceNaira: z.number().nonnegative().nullable(),
});

const productInputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: slugSchema,
  description: z.string().trim().max(10_000),
  status: productStatusSchema,
  featured: z.boolean(),
  priceNaira: z.number().positive().max(10_000_000),
  imageUrl: z.string().url().nullable(),
  variants: z.array(variantSchema).min(1),
});

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export const getAdminProducts = createServerFn({
  method: "GET",
}).handler(async () => {
  await requireAdmin();

  const [productRows, imageRows, variantRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),

    db.select().from(productImages).orderBy(asc(productImages.position)),

    db.select().from(productVariants),
  ]);

  return productRows.map((product) => {
    const productVariantsForProduct = variantRows.filter(
      (variant) => variant.productId === product.id,
    );

    const image = imageRows.find((entry) => entry.productId === product.id);

    return {
      ...product,
      imageUrl: image?.url ?? null,
      variantCount: productVariantsForProduct.length,
      stock: productVariantsForProduct.reduce(
        (total, variant) => total + variant.stock,
        0,
      ),
    };
  });
});

export const getAdminProduct = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      productId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      return null;
    }

    const [images, variants] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.position)),

      db
        .select()
        .from(productVariants)
        .where(eq(productVariants.productId, product.id))
        .orderBy(asc(productVariants.size)),
    ]);

    return {
      ...product,
      images,
      variants,
    };
  });

export const createAdminProduct = createServerFn({
  method: "POST",
})
  .validator(productInputSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    const product = await db.transaction(async (tx) => {
      const [createdProduct] = await tx
        .insert(products)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description,
          status: data.status,
          featured: data.featured,
          priceKobo: Math.round(data.priceNaira * 100),
        })
        .returning();

      await tx.insert(productVariants).values(
        data.variants.map((variant) => ({
          productId: createdProduct.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          priceKobo:
            variant.priceNaira === null
              ? null
              : Math.round(variant.priceNaira * 100),
        })),
      );

      if (data.imageUrl) {
        await tx.insert(productImages).values({
          productId: createdProduct.id,
          url: data.imageUrl,
          alt: data.name,
          position: 0,
        });
      }

      return createdProduct;
    });

    return {
      productId: product.id,
    };
  });

export const updateAdminProduct = createServerFn({
  method: "POST",
})
  .validator(
    productInputSchema
      .omit({
        imageUrl: true,
        variants: true,
      })
      .extend({
        productId: z.uuid(),
      }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [updatedProduct] = await db
      .update(products)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        status: data.status,
        featured: data.featured,
        priceKobo: Math.round(data.priceNaira * 100),
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.productId))
      .returning();

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    return updatedProduct;
  });

export const addAdminVariant = createServerFn({
  method: "POST",
})
  .validator(
    variantSchema.extend({
      productId: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId: data.productId,
        sku: data.sku,
        size: data.size,
        color: data.color,
        stock: data.stock,
        priceKobo:
          data.priceNaira === null ? null : Math.round(data.priceNaira * 100),
      })
      .returning();

    return variant;
  });

export const updateAdminVariantStock = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      variantId: z.uuid(),
      stock: z.number().int().min(0).max(100_000),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const [variant] = await db
      .update(productVariants)
      .set({
        stock: data.stock,
      })
      .where(eq(productVariants.id, data.variantId))
      .returning();

    if (!variant) {
      throw new Error("Variant not found");
    }

    return variant;
  });

function createCloudinarySignature(
  values: Record<string, string | number>,
  apiSecret: string,
) {
  const valueToSign = Object.entries(values)
    .filter(([, value]) => value !== "" && value !== undefined)
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${valueToSign}${apiSecret}`).digest("hex");
}

export const prepareProductImageUpload = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary environment variables are missing.");
    }

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found.");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "store/products";

    return {
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature: createCloudinarySignature({ folder, timestamp }, apiSecret),
    };
  });

export const saveAdminProductImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      url: z.string().url(),
      alt: z.string().trim().max(200).default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    const imageUrl = new URL(data.url);

    if (
      imageUrl.protocol !== "https:" ||
      !imageUrl.hostname.endsWith("cloudinary.com")
    ) {
      throw new Error("Only Cloudinary image URLs can be saved.");
    }

    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!product) {
      throw new Error("Product not found.");
    }

    const [lastImage] = await db
      .select({
        position: max(productImages.position),
      })
      .from(productImages)
      .where(eq(productImages.productId, data.productId));

    const [image] = await db
      .insert(productImages)
      .values({
        productId: data.productId,
        url: data.url,
        alt: data.alt || "Product image",
        position: (lastImage?.position ?? -1) + 1,
      })
      .returning();

    return image;
  });

export const deleteAdminProductImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      imageId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();

    await db
      .delete(productImages)
      .where(
        and(
          eq(productImages.id, data.imageId),
          eq(productImages.productId, data.productId),
        ),
      );

    return { success: true };
  });
