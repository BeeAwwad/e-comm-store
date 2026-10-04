import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ProductCard } from "../../components/product-card";
import { getShopCategories } from "../../features/categories/server/get-shop-categories";
import { getProducts } from "../../features/products/server/get-products";

const shopSearchSchema = z.object({
  search: z.string().optional().catch(""),
  category: z.string().optional().catch(""),
  sort: z
    .enum(["featured", "price-asc", "price-desc"])
    .optional()
    .catch("featured"),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: shopSearchSchema,
  loaderDeps: ({ search }) => ({
    search: search.search,
    category: search.category,
    sort: search.sort,
  }),
  loader: async ({ deps }) => {
    const [products, categories] = await Promise.all([
      getProducts({
        data: {
          search: deps.search,
          category: deps.category,
          sort: deps.sort,
        },
      }),
      getShopCategories(),
    ]);

    return { products, categories };
  },
  component: ShopPage,
});

function ShopPage() {
  const { products, categories } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  function updateFilters(next: {
    search?: string;
    category?: string;
    sort?: "featured" | "price-asc" | "price-desc";
  }) {
    void navigate({
      search: (current) => ({
        ...current,
        ...next,
      }),
    });
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <section className="px-4 pb-20 pt-24 md:px-8 lg:px-12">
        <h1 className="mb-10 text-5xl font-black uppercase tracking-[-0.04em] md:text-7xl">
          Shop
        </h1>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilters({ category: "" })}
            className={[
              "border px-4 py-2 text-[11px] uppercase tracking-[0.16em]",
              !search.category
                ? "border-white bg-white text-black"
                : "border-white/15 text-neutral-400 hover:border-white hover:text-white",
            ].join(" ")}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => updateFilters({ category: category.slug })}
              className={[
                "border px-4 py-2 text-[11px] uppercase tracking-[0.16em]",
                search.category === category.slug
                  ? "border-white bg-white text-black"
                  : "border-white/15 text-neutral-400 hover:border-white hover:text-white",
              ].join(" ")}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mb-10 grid gap-3 border-y border-white/10 py-5 md:grid-cols-[1fr_auto]">
          <input
            type="search"
            value={search.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder="Search products"
            className="w-full border border-white/15 bg-black px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white"
          />

          <select
            value={search.sort}
            onChange={(event) =>
              updateFilters({
                sort: event.target.value as
                  "featured" | "price-asc" | "price-desc",
              })
            }
            className="border border-white/15 bg-black px-4 py-3 text-[11px] uppercase tracking-[0.16em] outline-none focus:border-white"
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
