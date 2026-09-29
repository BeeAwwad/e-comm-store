import { createFileRoute, notFound } from "@tanstack/react-router";
import { AddToCart } from "#/components/add-to-cart";
import { getProduct } from "#/features/products/server/get-product";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/shop/$productSlug")({
  loader: async ({ params }) => {
    const product = await getProduct({
      data: {
        slug: params.productSlug,
      },
    });

    if (!product) {
      throw notFound();
    }

    return product;
  },
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-24 text-white md:px-8 lg:px-12">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {product.images.map((image) => (
            <div
              key={image.id}
              className="aspect-[4/5] overflow-hidden bg-neutral-900"
            >
              <img
                src={image.url}
                alt={image.alt}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <section className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs uppercase tracking-[0.25em] text-red-500">
            New release
          </p>

          <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">
            {product.name}
          </h1>

          <p className="mt-5 text-lg">{formatNaira(product.priceKobo)}</p>

          <p className="my-8 max-w-xl whitespace-pre-line leading-7 text-neutral-400">
            {product.description}
          </p>

          <AddToCart product={product} />
        </section>
      </div>
    </main>
  );
}
