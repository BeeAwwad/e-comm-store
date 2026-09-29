import {
  createFileRoute,
  notFound,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "#/db";
import { orderItems, orders } from "#/db/schema";
import { formatNaira } from "#/lib/utils";

const getPublicOrder = createServerFn({ method: "GET" })
  .validator(
    z.object({
      publicToken: z.uuid(),
    }),
  )
  .handler(async ({ data }) => {
    const order = await db.query.orders.findFirst({
      where: eq(orders.publicToken, data.publicToken),
    });

    if (!order) return null;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.productName));

    return {
      order,
      items,
    };
  });

export const Route = createFileRoute(
  "/order/$publicToken",
)({
  loader: async ({ params }) => {
    const result = await getPublicOrder({
      data: {
        publicToken: params.publicToken,
      },
    });

    if (!result) throw notFound();

    return result;
  },
  component: PublicOrderPage,
});

function PublicOrderPage() {
  const { order, items } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-24 text-white md:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Order status
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <h1 className="text-4xl font-black uppercase">
            {order.orderNumber}
          </h1>

          <span className="border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.15em]">
            {order.status}
          </span>
        </div>

        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex justify-between gap-5 py-5"
            >
              <div>
                <h2 className="font-bold uppercase">
                  {item.productName}
                </h2>
                <p className="mt-2 text-xs uppercase text-neutral-500">
                  {item.color} / {item.size} ×{" "}
                  {item.quantity}
                </p>
              </div>

              <p>
                {formatNaira(item.lineTotalKobo)}
              </p>
            </article>
          ))}
        </div>

        <dl className="ml-auto mt-8 max-w-sm space-y-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd>{formatNaira(order.subtotalKobo)}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-neutral-500">Shipping</dt>
            <dd>{formatNaira(order.shippingKobo)}</dd>
          </div>

          <div className="flex justify-between border-t border-white/10 pt-4 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatNaira(order.totalKobo)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
