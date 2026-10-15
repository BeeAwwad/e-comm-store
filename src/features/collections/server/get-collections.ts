import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNotNull, asc, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { collections } from "#/db/schema";

export const getPublishedCollection = createServerFn({
  method: "GET",
})
  .validator(
    z.object({
      slug: z.string().min(1).max(100),
    }),
  )
  .handler(async ({ data }) => {
    return db.query.collections.findFirst({
      where: and(
        eq(collections.slug, data.slug),
        eq(collections.archived, false),
        isNotNull(collections.publishedAt),
      ),
    });
  });

export const getPublishedCollections = createServerFn({
  method: "GET",
}).handler(async () => {
  return db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      publishedAt: collections.publishedAt,
    })
    .from(collections)
    .where(
      and(eq(collections.archived, false), isNotNull(collections.publishedAt)),
    )
    .orderBy(desc(collections.publishedAt), asc(collections.name));
});
