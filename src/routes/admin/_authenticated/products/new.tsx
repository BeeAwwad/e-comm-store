import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type SubmitEvent } from "react";
import { createAdminProduct } from "#/features/admin/products/server/products";

type VariantDraft = {
  sku: string;
  size: string;
  color: string;
  stock: string;
  priceNaira: string;
};

const emptyVariant = (): VariantDraft => ({
  sku: "",
  size: "M",
  color: "Default",
  stock: "0",
  priceNaira: "",
});

export const Route = createFileRoute("/admin/_authenticated/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();

  const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function addVariant() {
    setVariants((current) => [...current, emptyVariant()]);
  }

  function updateVariant(
    index: number,
    key: keyof VariantDraft,
    value: string,
  ) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [key]: value,
            }
          : variant,
      ),
    );
  }

  function removeVariant(index: number) {
    setVariants((current) =>
      current.filter((_, variantIndex) => variantIndex !== index),
    );
  }

  function createSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setSaving(true);
    setError("");

    try {
      const result = await createAdminProduct({
        data: {
          name: String(form.get("name")),
          slug: String(form.get("slug")),
          description: String(form.get("description")),
          status: String(form.get("status")) as "draft" | "active" | "archived",
          featured: form.get("featured") === "on",
          priceNaira: Number(form.get("priceNaira")),
          imageUrl: String(form.get("imageUrl")).trim() || null,
          variants: variants.map((variant) => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stock: Number(variant.stock),
            priceNaira:
              variant.priceNaira === "" ? null : Number(variant.priceNaira),
          })),
        },
      });

      await navigate({
        to: "/admin/products/$productId",
        params: {
          productId: result.productId,
        },
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create product.",
      );
      setSaving(false);
    }
  }

  return (
    <section className="max-w-4xl">
      <p className="text-xs uppercase tracking-[0.25em] text-red-500">
        Catalog
      </p>

      <h1 className="mt-3 text-4xl font-black uppercase">New product</h1>

      <form onSubmit={handleSubmit} className="mt-10 space-y-10">
        <fieldset className="grid gap-5 border border-white/10 p-6">
          <legend className="px-2 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Product details
          </legend>

          <label className="grid gap-2 text-sm">
            Product name
            <input
              required
              name="name"
              onBlur={(event) => {
                const slugInput = event.currentTarget.form?.elements.namedItem(
                  "slug",
                ) as HTMLInputElement | null;

                if (slugInput && !slugInput.value) {
                  slugInput.value = createSlug(event.currentTarget.value);
                }
              }}
              className="border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-white"
            />
          </label>

          <label className="grid gap-2 text-sm">
            URL slug
            <input
              required
              name="slug"
              placeholder="midnight-football-jersey"
              className="border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-white"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Description
            <textarea
              required
              name="description"
              rows={6}
              className="border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-white"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Base price (₦)
              <input
                required
                name="priceNaira"
                type="number"
                min="1"
                step="0.01"
                className="border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-white"
              />
            </label>

            <label className="grid gap-2 text-sm">
              Status
              <select
                name="status"
                defaultValue="draft"
                className="border border-white/15 bg-[#080808] px-4 py-3 outline-none focus:border-white"
              >
                <option value="draft">Draft</option>
                <option value="active">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            Temporary image URL
            <input
              name="imageUrl"
              type="url"
              placeholder="https://images.example.com/product.jpg"
              className="border border-white/15 bg-transparent px-4 py-3 outline-none focus:border-white"
            />
            <span className="text-xs text-neutral-500">
              R2 uploads replace this field in the next image management slice.
            </span>
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input name="featured" type="checkbox" />
            Show as featured product
          </label>
        </fieldset>

        <fieldset className="border border-white/10 p-6">
          <legend className="px-2 text-xs uppercase tracking-[0.16em] text-neutral-500">
            Variants and stock
          </legend>

          <div className="space-y-5">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="grid gap-3 border border-white/10 p-4 md:grid-cols-5"
              >
                <input
                  required
                  value={variant.sku}
                  onChange={(event) =>
                    updateVariant(index, "sku", event.target.value)
                  }
                  placeholder="SKU"
                  className="border border-white/15 bg-transparent px-3 py-2 text-sm"
                />

                <input
                  required
                  value={variant.size}
                  onChange={(event) =>
                    updateVariant(index, "size", event.target.value)
                  }
                  placeholder="Size"
                  className="border border-white/15 bg-transparent px-3 py-2 text-sm"
                />

                <input
                  required
                  value={variant.color}
                  onChange={(event) =>
                    updateVariant(index, "color", event.target.value)
                  }
                  placeholder="Color"
                  className="border border-white/15 bg-transparent px-3 py-2 text-sm"
                />

                <input
                  required
                  min="0"
                  type="number"
                  value={variant.stock}
                  onChange={(event) =>
                    updateVariant(index, "stock", event.target.value)
                  }
                  placeholder="Stock"
                  className="border border-white/15 bg-transparent px-3 py-2 text-sm"
                />

                <div className="flex gap-2">
                  <input
                    min="0"
                    type="number"
                    step="0.01"
                    value={variant.priceNaira}
                    onChange={(event) =>
                      updateVariant(index, "priceNaira", event.target.value)
                    }
                    placeholder="Override ₦"
                    className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2 text-sm"
                  />

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="border border-red-500/40 px-3 text-xs text-red-300"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addVariant}
            className="mt-5 border border-white/20 px-4 py-3 text-xs uppercase tracking-[0.14em] hover:border-white"
          >
            Add variant
          </button>
        </fieldset>

        {error && (
          <p className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-red-600 px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create product"}
        </button>
      </form>
    </section>
  );
}
