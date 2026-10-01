import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";

import {
  addAdminVariant,
  getAdminProduct,
  updateAdminProduct,
  updateAdminVariantStock,
} from "#/features/admin/products/server/products";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute(
  "/admin/_authenticated/products/$productId",
)({
  loader: async ({ params }) => {
    const product = await getAdminProduct({
      data: {
        productId: params.productId,
      },
    });

    if (!product) {
      throw notFound();
    }

    return product;
  },
  component: EditProductPage,
});

function EditProductPage() {
  const product = Route.useLoaderData();
  const router = useRouter();

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newVariantOpen, setNewVariantOpen] = useState(false);
  const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(
    null,
  );
  async function handleProductUpdate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setSaving(true);
    setError("");

    try {
      await updateAdminProduct({
        data: {
          productId: product.id,
          name: String(form.get("name")),
          slug: String(form.get("slug")),
          description: String(form.get("description")),
          status: String(form.get("status")) as "draft" | "active" | "archived",
          featured: form.get("featured") === "on",
          priceNaira: Number(form.get("priceNaira")),
        },
      });

      await router.invalidate({
        sync: true,
      });
      setSaving(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update product.",
      );
      setSaving(false);
    }
  }

  async function handleStockUpdate(variantId: string, stock: number) {
    setError("");
    setUpdatingVariantId(variantId);
    try {
      await updateAdminVariantStock({
        data: {
          variantId,
          stock,
        },
      });

      await router.invalidate({
        sync: true,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update stock.",
      );
    } finally {
      setUpdatingVariantId(null);
    }
  }

  async function handleAddVariant(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    try {
      await addAdminVariant({
        data: {
          productId: product.id,
          sku: String(form.get("sku")),
          size: String(form.get("size")),
          color: String(form.get("color")),
          stock: Number(form.get("stock")),
          priceNaira:
            String(form.get("priceNaira")) === ""
              ? null
              : Number(form.get("priceNaira")),
        },
      });

      await router.invalidate({
        sync: true,
      });
      setNewVariantOpen(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not add variant.",
      );
    }
  }

  return (
    <section className="max-w-4xl">
      <p className="text-xs uppercase tracking-[0.25em] text-red-500">
        Product editor
      </p>

      <h1 className="mt-3 text-4xl font-black uppercase">{product.name}</h1>

      <form
        onSubmit={handleProductUpdate}
        className="mt-10 grid gap-5 border border-white/10 p-6"
      >
        <label className="grid gap-2 text-sm">
          Product name
          <input
            required
            name="name"
            defaultValue={product.name}
            className="border border-white/15 bg-transparent px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm">
          URL slug
          <input
            required
            name="slug"
            defaultValue={product.slug}
            className="border border-white/15 bg-transparent px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm">
          Description
          <textarea
            required
            name="description"
            rows={6}
            defaultValue={product.description}
            className="border border-white/15 bg-transparent px-4 py-3"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            Base price (₦)
            <input
              required
              min="1"
              name="priceNaira"
              type="number"
              step="0.01"
              defaultValue={product.priceKobo / 100}
              className="border border-white/15 bg-transparent px-4 py-3"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Status
            <select
              name="status"
              defaultValue={product.status}
              className="border border-white/15 bg-[#080808] px-4 py-3"
            >
              <option value="draft">Draft</option>
              <option value="active">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={product.featured}
          />
          Show as featured product
        </label>

        {error && (
          <p className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-fit bg-red-600 px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save product"}
        </button>
      </form>

      <section className="mt-10 border border-white/10 p-6">
        <div className="flex items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-black uppercase">
              Variants and inventory
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Variant prices override the base product price.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNewVariantOpen((current) => !current)}
            className="border border-white/20 px-4 py-3 text-xs uppercase tracking-[0.14em]"
          >
            Add variant
          </button>
        </div>

        {newVariantOpen && (
          <form
            onSubmit={handleAddVariant}
            className="mt-6 grid gap-3 border border-white/10 p-4 md:grid-cols-5"
          >
            <input
              required
              name="sku"
              placeholder="SKU"
              className="border border-white/15 bg-transparent px-3 py-2 text-sm"
            />

            <input
              required
              name="size"
              placeholder="Size"
              className="border border-white/15 bg-transparent px-3 py-2 text-sm"
            />

            <input
              required
              name="color"
              defaultValue="Default"
              placeholder="Color"
              className="border border-white/15 bg-transparent px-3 py-2 text-sm"
            />

            <input
              required
              min="0"
              name="stock"
              type="number"
              defaultValue="0"
              className="border border-white/15 bg-transparent px-3 py-2 text-sm"
            />

            <input
              min="0"
              name="priceNaira"
              type="number"
              step="0.01"
              placeholder="Override ₦"
              className="border border-white/15 bg-transparent px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="w-fit bg-white px-4 py-3 text-xs font-bold uppercase text-black"
            >
              Save variant
            </button>
          </form>
        )}

        <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
          {product.variants.map((variant) => (
            <form
              key={variant.id}
              onSubmit={(event) => {
                event.preventDefault();

                const form = new FormData(event.currentTarget);

                void handleStockUpdate(variant.id, Number(form.get("stock")));
              }}
              className="grid items-center gap-4 py-4 md:grid-cols-[1fr_120px_120px_110px]"
            >
              <div>
                <p className="font-medium">
                  {variant.size} / {variant.color}
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  {variant.sku} ·{" "}
                  {formatNaira(variant.priceKobo ?? product.priceKobo)}
                </p>
              </div>

              <p className="text-sm text-neutral-400">
                {variant.active ? "Active" : "Inactive"}
              </p>

              <input
                required
                min="0"
                name="stock"
                type="number"
                defaultValue={variant.stock}
                className="border border-white/15 bg-transparent px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={updatingVariantId === variant.id}
                className="border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingVariantId === variant.id ? "Saving…" : "Update"}
              </button>
            </form>
          ))}
        </div>
      </section>
    </section>
  );
}
