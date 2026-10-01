import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminProducts } from "#/features/admin/products/server/products";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/admin/_authenticated/products/")({
  loader: () => getAdminProducts(),
  component: ProductsPage,
});

function ProductsPage() {
  const products = Route.useLoaderData();

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-red-500">
            Catalog
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase">Products</h1>
        </div>

        <Link
          to="/admin/products/new"
          className="bg-red-600 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] hover:bg-red-500"
        >
          Add product
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto border border-white/10">
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-neutral-500">
            <tr>
              <th className="px-5 py-4 font-medium">Product</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Price</th>
              <th className="px-5 py-4 font-medium">Variants</th>
              <th className="px-5 py-4 font-medium">Stock</th>
              <th className="px-5 py-4 font-medium" />
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 shrink-0 overflow-hidden bg-white/5">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      )}
                    </div>

                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        /{product.slug}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em]">
                    {product.status}
                  </span>
                </td>

                <td className="px-5 py-4">{formatNaira(product.priceKobo)}</td>

                <td className="px-5 py-4">{product.variantCount}</td>

                <td className="px-5 py-4">{product.stock}</td>

                <td className="px-5 py-4 text-right">
                  <Link
                    to="/admin/products/$productId"
                    params={{
                      productId: product.id,
                    }}
                    className="text-xs uppercase tracking-[0.14em] text-neutral-400 hover:text-white"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-neutral-500"
                >
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
