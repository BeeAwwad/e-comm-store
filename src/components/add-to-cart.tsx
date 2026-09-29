import { useMemo, useState } from "react";
import { addCartItem } from "#/features/cart/cart-store";
import { formatNaira } from "#/lib/utils";

type Variant = {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceKobo: number | null;
};

type Props = {
  product: {
    id: string;
    name: string;
    slug: string;
    priceKobo: number;
    images: Array<{
      url: string;
    }>;
    variants: Variant[];
  };
};

export function AddToCart({ product }: Props) {
  const availableVariants = useMemo(
    () => product.variants.filter((variant) => variant.stock > 0),
    [product.variants],
  );

  const [variantId, setVariantId] = useState(availableVariants[0]?.id ?? "");

  const selectedVariant = availableVariants.find(
    (variant) => variant.id === variantId,
  );

  const soldOut = availableVariants.length === 0;

  function handleAdd() {
    if (!selectedVariant) return;

    addCartItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      imageUrl: product.images[0]?.url ?? null,
      size: selectedVariant.size,
      color: selectedVariant.color,
      priceKobo: selectedVariant.priceKobo ?? product.priceKobo,
      quantity: 1,
      stock: selectedVariant.stock,
    });

    window.location.assign("/cart");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">
          Select size
        </p>

        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => {
            const unavailable = variant.stock <= 0;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={unavailable}
                onClick={() => setVariantId(variant.id)}
                className={[
                  "min-w-14 border px-4 py-3 text-xs uppercase",
                  variantId === variant.id
                    ? "border-white bg-white text-black"
                    : "border-white/20 text-white",
                  unavailable
                    ? "cursor-not-allowed opacity-30 line-through"
                    : "hover:border-white",
                ].join(" ")}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={soldOut || !selectedVariant}
        onClick={handleAdd}
        className="w-full bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {soldOut
          ? "Sold out"
          : `Add to cart — ${formatNaira(
              selectedVariant?.priceKobo ?? product.priceKobo,
            )}`}
      </button>
    </div>
  );
}
