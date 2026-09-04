import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  categories,
  productCategories,
  productImages,
  products,
  productVariants,
} from "./schema";

const seedProducts = [
  {
    name: "Midnight Football Jersey",
    slug: "midnight-football-jersey",
    description:
      "A relaxed football jersey with embroidered details and a heavyweight collar.",
    category: "Jerseys",
    priceKobo: 30_000_00,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
    variants: [
      { size: "S", stock: 5 },
      { size: "M", stock: 8 },
      { size: "L", stock: 4 },
      { size: "XL", stock: 2 },
    ],
  },
  {
    name: "World Tour Tee",
    slug: "world-tour-tee",
    description:
      "An oversized cotton tee with a screen-printed front and back.",
    category: "Tees",
    priceKobo: 25_000_00,
    featured: true,
    image:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1200&q=85",
    variants: [
      { size: "S", stock: 4 },
      { size: "M", stock: 6 },
      { size: "L", stock: 6 },
      { size: "XL", stock: 3 },
    ],
  },
  {
    name: "Studio Polo",
    slug: "studio-polo",
    description:
      "A structured polo with a slightly cropped streetwear silhouette.",
    category: "Polos",
    priceKobo: 40_000_00,
    featured: false,
    image:
      "https://images.unsplash.com/photo-1625910513413-5fc45e7e7f64?auto=format&fit=crop&w=1200&q=85",
    variants: [
      { size: "M", stock: 3 },
      { size: "L", stock: 5 },
      { size: "XL", stock: 2 },
    ],
  },
];

async function seed() {
  for (const item of seedProducts) {
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, item.slug),
    });

    if (existing) {
      console.log(`Skipping existing product: ${item.name}`);
      continue;
    }

    const [category] = await db
      .insert(categories)
      .values({
        name: item.category,
        slug: item.category.toLowerCase(),
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: {
          name: item.category,
        },
      })
      .returning();

    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug: item.slug,
        description: item.description,
        status: "active",
        featured: item.featured,
        priceKobo: item.priceKobo,
      })
      .returning();

    await db.insert(productCategories).values({
      productId: product.id,
      categoryId: category.id,
    });

    await db.insert(productImages).values({
      productId: product.id,
      url: item.image,
      alt: item.name,
      position: 0,
    });

    await db.insert(productVariants).values(
      item.variants.map((variant) => ({
        productId: product.id,
        sku: `${item.slug}-${variant.size}`.toUpperCase(),
        size: variant.size,
        color: "Black",
        stock: variant.stock,
      })),
    );

    console.log(`Created product: ${item.name}`);
  }
}

seed()
  .then(() => {
    console.log("Database seeded");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });