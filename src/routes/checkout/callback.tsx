import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { orders, payments } from "#/db/schema";
import { clearCart } from "#/features/cart/cart-store";
import { completePayment } from "#/features/payment/server/complete-payment";
import { verifyPaystackTransaction } from "#/lib/paystack";
import { useEffect } from "react";

const callbackSearchSchema = z.object({
  reference: z.string().optional().catch(""),
  trxref: z.string().optional().catch(""),
});

const verifyCheckout = createServerFn({ method: "POST" })
  .validator(
    z.object({
      reference: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const verified = await verifyPaystackTransaction(data.reference);

    await completePayment(verified);

    const [result] = await db
      .select({
        orderNumber: orders.orderNumber,
        publicToken: orders.publicToken,
      })
      .from(payments)
      .innerJoin(orders, eq(orders.id, payments.orderId))
      .where(eq(payments.reference, data.reference))
      .limit(1);

    if (!result) {
      throw new Error("Order not found");
    }

    return result;
  });

export const Route = createFileRoute("/checkout/callback")({
  validateSearch: callbackSearchSchema,
  loaderDeps: ({ search }) => ({
    reference: search.reference || search.trxref,
  }),
  loader: async ({ deps }) => {
    if (!deps.reference) {
      throw new Error("Missing payment reference");
    }

    return verifyCheckout({
      data: {
        reference: deps.reference,
      },
    });
  },
  component: CheckoutCallbackPage,
  errorComponent: CheckoutError,
});

function CheckoutCallbackPage() {
  const result = Route.useLoaderData();

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-[#080808] px-4 text-white">
      <section className="max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-green-500">
          Payment confirmed
        </p>

        <h1 className="mt-5 text-5xl font-black uppercase tracking-[-0.04em]">
          Order received
        </h1>

        <p className="mt-5 text-neutral-400">
          Your order number is{" "}
          <strong className="text-white">{result.orderNumber}</strong>.
        </p>

        <Link
          to="/order/$publicToken"
          params={{
            publicToken: result.publicToken,
          }}
          className="mt-8 inline-block bg-white px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-black"
        >
          View order
        </Link>
      </section>
    </main>
  );
}

function CheckoutError() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080808] px-4 text-white">
      <section className="max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Payment not confirmed
        </p>

        <h1 className="mt-5 text-4xl font-black uppercase">
          We could not verify your payment
        </h1>

        <p className="mt-5 text-neutral-400">
          If your account was charged, contact the store and include your
          Paystack reference.
        </p>

        <Link
          to="/cart"
          className="mt-8 inline-block border border-white px-6 py-4 text-xs font-bold uppercase tracking-[0.18em]"
        >
          Return to cart
        </Link>
      </section>
    </main>
  );
}
