import {
  ClientOnly,
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type SubmitEvent } from "react";
import {
  createCheckout,
  getCheckoutConfig,
} from "#/features/checkout/server/create-checkout";
import { useCart } from "#/features/cart/use-cart";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/checkout/")({
  loader: () => getCheckoutConfig(),
  component: CheckoutRoute,
});

const inputClass =
  "w-full border border-white/15 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-600 focus:border-white disabled:cursor-not-allowed disabled:opacity-50";

function CheckoutRoute() {
  const checkoutConfig = Route.useLoaderData();

  return (
    <ClientOnly fallback={<CheckoutSkeleton />}>
      <CheckoutPage shippingKobo={checkoutConfig.shippingKobo} />
    </ClientOnly>
  );
}

function CheckoutPage({ shippingKobo }: { shippingKobo: number }) {
  const cart = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cart.hydrated && cart.items.length === 0) {
      void navigate({
        to: "/cart",
        replace: true,
      });
    }
  }, [cart.hydrated, cart.items.length, navigate]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cart.items.length === 0) {
      return;
    }

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
          : "Checkout could not be created. Please try again.",
      );

      setSubmitting(false);
    }
  }

  if (!cart.hydrated || cart.items.length === 0) {
    return <CheckoutSkeleton />;
  }

  const totalKobo = cart.subtotalKobo + shippingKobo;

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-12 text-white md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Secure checkout
        </p>

        <h1 className="mt-3 text-5xl font-black uppercase tracking-[-0.04em]">
          Checkout
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
          Enter your delivery details. You will complete payment securely on
          Paystack.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]"
        >
          <section>
            <h2 className="mb-6 text-lg font-bold uppercase">Contact</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                autoComplete="given-name"
                name="firstName"
                placeholder="First name"
                className={inputClass}
              />

              <input
                required
                autoComplete="family-name"
                name="lastName"
                placeholder="Last name"
                className={inputClass}
              />

              <input
                required
                type="email"
                autoComplete="email"
                name="email"
                placeholder="Email address"
                className={inputClass}
              />

              <input
                required
                type="tel"
                autoComplete="tel"
                name="phone"
                placeholder="Phone number"
                className={inputClass}
              />
            </div>

            <h2 className="mb-3 mt-12 text-lg font-bold uppercase">Delivery</h2>

            <p className="mb-6 text-sm text-neutral-500">
              We currently deliver within Nigeria.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                autoComplete="address-line1"
                name="addressLine1"
                placeholder="Street address"
                className={`${inputClass} sm:col-span-2`}
              />

              <input
                autoComplete="address-line2"
                name="addressLine2"
                placeholder="Apartment, suite, landmark (optional)"
                className={`${inputClass} sm:col-span-2`}
              />

              <input
                required
                autoComplete="address-level2"
                name="city"
                placeholder="City"
                className={inputClass}
              />

              <input
                required
                autoComplete="address-level1"
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

            {error ? (
              <div
                role="alert"
                className="mt-6 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
              >
                <p className="font-bold uppercase">Checkout needs attention</p>
                <p className="mt-2">{error}</p>

                <Link
                  to="/cart"
                  className="mt-4 inline-block text-xs font-bold uppercase tracking-[0.14em] text-white"
                >
                  Review cart →
                </Link>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="mt-8 w-full bg-red-600 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-300"
            >
              {submitting
                ? "Opening secure payment…"
                : `Pay ${formatNaira(totalKobo)}`}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
              By continuing, you will be redirected to Paystack to complete
              payment securely.
            </p>
          </section>

          <aside className="h-fit border border-white/10 p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold uppercase">Order summary</h2>

            <div className="mt-6 space-y-5">
              {cart.items.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden bg-neutral-900">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="size-full object-cover"
                      />
                    ) : null}

                    <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-white text-xs text-black">
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

                  <p className="shrink-0 text-sm">
                    {formatNaira(item.priceKobo * item.quantity)}
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
                <dt className="text-neutral-500">Standard delivery</dt>
                <dd>{formatNaira(shippingKobo)}</dd>
              </div>

              <div className="flex justify-between border-t border-white/10 pt-4 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatNaira(totalKobo)}</dd>
              </div>
            </dl>

            <p className="mt-6 border-l-2 border-red-500 pl-3 text-xs leading-5 text-neutral-500">
              Delivery fees are confirmed before payment. You will receive order
              and shipment updates by email.
            </p>

            <Link
              to="/cart"
              className="mt-6 block text-center text-xs uppercase tracking-[0.15em] text-neutral-500 hover:text-white"
            >
              Return to cart
            </Link>
          </aside>
        </form>
      </div>
    </main>
  );
}

function CheckoutSkeleton() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-12 text-white md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-28 animate-pulse bg-white/10" />
        <div className="mt-5 h-14 w-64 animate-pulse bg-white/10" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
          <section className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-12 animate-pulse bg-white/5" />
            ))}
          </section>

          <aside className="h-80 animate-pulse border border-white/10 bg-white/5" />
        </div>
      </div>
    </main>
  );
}
