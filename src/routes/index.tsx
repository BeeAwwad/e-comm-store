import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "#/components/product-card";
import { getPublishedCollections } from "#/features/collections/server/get-collections";
import { getProducts } from "#/features/products/server/get-products";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [products, collections] = await Promise.all([
      getProducts({
        data: {
          search: "",
          category: "",
          collection: "",
          sort: "featured",
        },
      }),
      getPublishedCollections(),
    ]);

    const featuredProducts = products.filter((product) => product.featured);

    return {
      featuredProducts:
        featuredProducts.length > 0
          ? featuredProducts.slice(0, 6)
          : products.slice(0, 6),
      collections: collections.slice(0, 3),
    };
  },
  component: Home,
});

function Home() {
  const { featuredProducts, collections } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-4 pb-20 pt-28 md:px-8 md:pb-28 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.3em] text-red-500">
            Independent clothing label
          </p>

          <h1 className="mt-6 max-w-5xl text-6xl font-black uppercase leading-[0.88] tracking-[-0.07em] md:text-8xl lg:text-9xl">
            Wear the
            <br />
            moment.
          </h1>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/shop/"
              className="bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200"
            >
              Shop now
            </Link>

            <Link
              to="/collections/"
              className="border border-white/20 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] transition hover:border-white"
            >
              Explore drops
            </Link>
          </div>
        </div>

        <p className="pointer-events-none absolute bottom-[-0.18em] right-[-0.03em] hidden select-none text-[17vw] font-black uppercase leading-none tracking-[-0.1em] text-white/[0.035] lg:block">
          Store
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-red-500">
              Latest release
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
              Featured pieces
            </h2>
          </div>

          <Link
            to="/shop/"
            className="hidden text-xs font-bold uppercase tracking-[0.14em] text-neutral-400 hover:text-white sm:block"
          >
            View all →
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid min-h-64 place-items-center border border-white/10">
            <p className="text-sm uppercase tracking-[0.16em] text-neutral-500">
              Products coming soon
            </p>
          </div>
        )}

        <Link
          to="/shop/"
          className="mt-10 inline-block text-xs font-bold uppercase tracking-[0.14em] text-neutral-400 hover:text-white sm:hidden"
        >
          View all products →
        </Link>
      </section>

      {collections.length > 0 ? (
        <section className="border-t border-white/10 px-4 py-20 md:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.25em] text-red-500">
              Shop by drop
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">
              Collections
            </h2>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  to="/collections/$collectionSlug"
                  params={{
                    collectionSlug: collection.slug,
                  }}
                  className="group min-h-72 border border-white/10 p-6 transition hover:border-white"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-red-500">
                    Collection
                  </p>

                  <h3 className="mt-6 text-3xl font-black uppercase">
                    {collection.name}
                  </h3>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-400">
                    {collection.description || "Explore this collection."}
                  </p>

                  <p className="mt-10 text-xs font-bold uppercase tracking-[0.14em] group-hover:underline">
                    Shop collection →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-white/10 px-4 py-20 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Designed with intent
            </p>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Pieces made to be worn repeatedly, styled freely, and kept close.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Secure payment
            </p>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Secure checkout powered by Paystack.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em]">
              Delivery updates
            </p>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Receive order and shipment updates through email.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
