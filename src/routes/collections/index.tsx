import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedCollections } from "#/features/collections/server/get-collections";

export const Route = createFileRoute("/collections/")({
  loader: () => getPublishedCollections(),
  component: CollectionsPage,
});

function CollectionsPage() {
  const collections = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-20 pt-24 text-white md:px-8 lg:px-12">
      <section className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Browse
        </p>

        <h1 className="mt-4 text-5xl font-black uppercase tracking-[-0.04em] md:text-7xl">
          Collections
        </h1>

        {collections.length > 0 ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$collectionSlug"
                params={{
                  collectionSlug: collection.slug,
                }}
                className="group min-h-64 border border-white/10 p-6 transition hover:border-white flex flex-col justify-between"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-red-500">
                  Shop collection
                </p>

                <h2 className="mt-5 text-3xl font-black uppercase">
                  {collection.name}
                </h2>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-400">
                  {collection.description || "Explore this collection."}
                </p>

                <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] group-hover:underline">
                  View collection →
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid min-h-64 place-items-center border border-white/10">
            <p className="text-sm uppercase tracking-[0.18em] text-neutral-500">
              No collections available
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
