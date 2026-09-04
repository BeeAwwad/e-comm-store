import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProductCard } from "../../components/product-card";
import { getProducts } from "../../features/products/server/get-products";

const shopSearchSchema = z.object({
  search: z.string().optional().catch(""),
  sort: z
    .enum(["featured", "price-asc", "price-desc"])
    .optional()
    .catch("featured"),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: shopSearchSchema,
  loaderDeps: ({ search }) => ({
    search: search.search,
    sort: search.sort,
  }),
  loader: ({ deps }) =>
    getProducts({
      data: {
        search: deps.search,
        sort: deps.sort,
      },
    }),
  component: ShopPage,
});

function ShopPage() {
  const products = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <section className="px-4 pb-20 pt-24 md:px-8 lg:px-12">
        <h1 className="mb-10 text-5xl font-black uppercase tracking-[-0.04em] md:text-7xl">
          Shop
        </h1>

        <div className="mb-10 flex flex-wrap gap-2 border-y border-white/10 py-5">
          {["All", "Jerseys", "Tees", "Polos", "Headwear"].map(
            (category, index) => (
              <button
                key={category}
                type="button"
                className={[
                  "border px-4 py-2 text-[11px] uppercase tracking-[0.16em]",
                  index === 0
                    ? "border-white bg-white text-black"
                    : "border-white/15 text-neutral-400 hover:border-white hover:text-white",
                ].join(" ")}
              >
                {category}
              </button>
            ),
          )}

          <select
            aria-label="Sort products"
            className="ml-auto border border-white/15 bg-black px-4 py-2 text-[11px] uppercase tracking-[0.16em]"
            defaultValue="featured"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
          </select>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center border border-white/10">
            <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
              No products found
            </p>
          </div>
        )}
      </section>
    </main>
  );
}