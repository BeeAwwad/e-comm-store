import { Link } from "@tanstack/react-router";
import { formatNaira } from "../lib/utils";

type ProductCardProps = {
  product: {
    name: string;
    slug: string;
    priceKobo: number;
    imageUrl: string | null;
    totalStock: number;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  const soldOut = Number(product.totalStock) <= 0;

  return (
    <Link
      to="/shop/$productSlug"
      params={{ productSlug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-neutral-900">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs uppercase tracking-[0.2em] text-neutral-600">
            No image
          </div>
        )}

        {soldOut && (
          <span className="absolute right-3 top-3 bg-black px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 py-4">
        <h2 className="text-sm font-medium uppercase tracking-wide">
          {product.name}
        </h2>

        <p className="shrink-0 text-sm text-neutral-300">
          {formatNaira(product.priceKobo)}
        </p>
      </div>
    </Link>
  );
}
