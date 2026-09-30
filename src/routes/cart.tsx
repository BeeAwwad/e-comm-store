import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { removeCartItem, updateCartQuantity } from "#/features/cart/cart-store";
import { useCart } from "#/features/cart/use-cart";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/cart")({
  component: CartRoute,
});

function CartRoute() {
  return (
    <ClientOnly fallback={<CartSkeleton />}>
      <CartPage />
    </ClientOnly>
  );
}

function CartPage() {
  const cart = useCart();

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-24 text-white md:px-8 lg:px-12">
      <h1 className="mb-12 text-5xl font-black uppercase tracking-[-0.04em]">
        Cart
      </h1>

      {cart.items.length === 0 ? (
        <section className="grid min-h-80 place-items-center border border-white/10">
          <div className="text-center">
            <p className="uppercase tracking-[0.2em] text-neutral-500">
              Your cart is empty
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-block bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black"
            >
              Continue shopping
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
          <section className="divide-y divide-white/10 border-y border-white/10">
            {cart.items.map((item) => (
              <article
                key={item.variantId}
                className="grid grid-cols-[100px_1fr] gap-5 py-6 sm:grid-cols-[140px_1fr_auto]"
              >
                <div className="aspect-4/5 overflow-hidden bg-neutral-900">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div>
                  <Link
                    to="/shop/$productSlug"
                    params={{
                      productSlug: item.productSlug,
                    }}
                    className="font-bold uppercase"
                  >
                    {item.productName}
                  </Link>

                  <p className="mt-2 text-xs uppercase text-neutral-500">
                    {item.color} / {item.size}
                  </p>

                  <p className="mt-3 text-sm">{formatNaira(item.priceKobo)}</p>

                  <div className="mt-5 flex items-center">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateCartQuantity(item.variantId, item.quantity - 1)
                      }
                      className="grid size-9 place-items-center border border-white/20"
                    >
                      <Minus size={14} />
                    </button>

                    <span className="grid size-9 place-items-center border-y border-white/20 text-xs">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={item.quantity >= item.stock}
                      onClick={() =>
                        updateCartQuantity(item.variantId, item.quantity + 1)
                      }
                      className="grid size-9 place-items-center border border-white/20 disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-5 sm:block sm:text-right">
                  <p className="font-medium">
                    {formatNaira(item.priceKobo * item.quantity)}
                  </p>

                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    onClick={() => removeCartItem(item.variantId)}
                    className="mt-5 text-neutral-500 hover:text-red-500"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="h-fit border border-white/10 p-6">
            <h2 className="text-xl font-bold uppercase">Summary</h2>

            <div className="mt-7 flex justify-between border-b border-white/10 pb-5 text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatNaira(cart.subtotalKobo)}</span>
            </div>

            <p className="my-5 text-xs leading-5 text-neutral-500">
              Shipping is calculated during checkout.
            </p>

            <a
              href="/checkout"
              className="block bg-red-600 px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-white"
            >
              Checkout
            </a>
          </aside>
        </div>
      )}
    </main>
  );
}

function CartSkeleton() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-24 text-white md:px-8 lg:px-12">
      <h1 className="mb-12 text-5xl font-black uppercase tracking-[-0.04em]">
        Cart
      </h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          {[1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse bg-white/5" />
          ))}
        </section>

        <aside className="h-56 animate-pulse border border-white/10 bg-white/5" />
      </div>
    </main>
  );
}
