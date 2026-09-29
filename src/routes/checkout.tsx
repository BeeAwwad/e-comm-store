import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { createCheckout } from "#/features/checkout/server/create-checkout";
import { useCart } from "#/features/cart/use-cart";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const inputClass =
  "w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white";

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const shippingKobo = 250_000;

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const result = await createCheckout({
        data: {
          email: String(form.get("email")),
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          phone: String(form.get("phone")),
          addressLine1: String(form.get("addressLine1")),
          addressLine2: String(form.get("addressLine2")),
          city: String(form.get("city")),
          state: String(form.get("state")),
          country: "Nigeria",
          items: cart.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        },
      });

      window.location.assign(result.authorizationUrl);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Checkout could not be created",
      );
      setSubmitting(false);
    }
  }

  if (cart.hydrated && cart.items.length === 0) {
    void navigate({
      to: "/cart",
      replace: true,
    });

    return null;
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-24 text-white md:px-8 lg:px-12">
      <h1 className="mb-12 text-5xl font-black uppercase tracking-[-0.04em]">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid gap-12 lg:grid-cols-[1fr_400px]"
      >
        <section>
          <h2 className="mb-6 text-lg font-bold uppercase">
            Contact
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              name="firstName"
              placeholder="First name"
              className={inputClass}
            />

            <input
              required
              name="lastName"
              placeholder="Last name"
              className={inputClass}
            />

            <input
              required
              type="email"
              name="email"
              placeholder="Email"
              className={inputClass}
            />

            <input
              required
              type="tel"
              name="phone"
              placeholder="Phone"
              className={inputClass}
            />
          </div>

          <h2 className="mb-6 mt-12 text-lg font-bold uppercase">
            Delivery
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              name="addressLine1"
              placeholder="Address"
              className={`${inputClass} sm:col-span-2`}
            />

            <input
              name="addressLine2"
              placeholder="Apartment, suite, etc. (optional)"
              className={`${inputClass} sm:col-span-2`}
            />

            <input
              required
              name="city"
              placeholder="City"
              className={inputClass}
            />

            <input
              required
              name="state"
              placeholder="State"
              className={inputClass}
            />

            <input
              disabled
              value="Nigeria"
              aria-label="Country"
              className={`${inputClass} sm:col-span-2`}
            />
          </div>

          {error && (
            <p className="mt-6 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !cart.hydrated}
            className="mt-8 w-full bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] hover:bg-red-500 disabled:opacity-50"
          >
            {submitting ? "Opening Paystack…" : "Pay now"}
          </button>
        </section>

        <aside className="h-fit border border-white/10 p-6">
          <div className="space-y-5">
            {cart.items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-4"
              >
                <div className="relative size-20 shrink-0 bg-neutral-900">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="size-full object-cover"
                    />
                  )}

                  <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-white text-xs text-black">
                    {item.quantity}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold uppercase">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {item.color} / {item.size}
                  </p>
                </div>

                <p className="text-sm">
                  {formatNaira(
                    item.priceKobo * item.quantity,
                  )}
                </p>
              </div>
            ))}
          </div>

          <dl className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd>{formatNaira(cart.subtotalKobo)}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-neutral-500">Shipping</dt>
              <dd>{formatNaira(shippingKobo)}</dd>
            </div>

            <div className="flex justify-between border-t border-white/10 pt-4 text-base font-bold">
              <dt>Total</dt>
              <dd>
                {formatNaira(
                  cart.subtotalKobo + shippingKobo,
                )}
              </dd>
            </div>
          </dl>

          <Link
            to="/cart"
            className="mt-6 block text-center text-xs uppercase tracking-[0.15em] text-neutral-500 hover:text-white"
          >
            Return to cart
          </Link>
        </aside>
      </form>
    </main>
  );
}