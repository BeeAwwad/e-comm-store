import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductCard } from "#/components/product-card";
import { getPublishedCollection } from "#/features/collections/server/get-collections";
import { getProducts } from "#/features/products/server/get-products";

export const Route = createFileRoute("/collections/$collectionSlug")({
  loader: async ({ params }) => {
    const collection = await getPublishedCollection({
      data: {
        slug: params.collectionSlug,
      },
    });

    if (!collection) {
      throw notFound();
    }

    const products = await getProducts({
      data: {
        search: "",
        sort: "featured",
        category: "",
        collection: collection.slug,
      },
    });

    return { collection, products };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { collection, products } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-24 text-white md:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Collection
        </p>

        <h1 className="mt-4 text-5xl font-black uppercase tracking-[-0.04em] md:text-7xl">
          {collection.name}
        </h1>

        {collection.description ? (
          <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-8 text-neutral-400">
            {collection.description}
          </p>
        ) : null}

        {products.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid min-h-64 place-items-center border border-white/10">
            <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">
              No products in this collection yet
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
