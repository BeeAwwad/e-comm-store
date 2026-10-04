import { createServerFn } from "@tanstack/react-start";
import { asc } from "drizzle-orm";
import { db } from "#/db";
import { categories } from "#/db/schema";

export const getShopCategories = createServerFn({
  method: "GET",
}).handler(async () => {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(asc(categories.name));
});
