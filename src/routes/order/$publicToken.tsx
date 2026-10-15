import { createFileRoute, notFound } from "@tanstack/react-router";
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

    if (!order) {
      return null;
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.productName));

    return { order, items };
  });

export const Route = createFileRoute("/order/$publicToken")({
  loader: async ({ params }) => {
    const result = await getPublicOrder({
      data: {
        publicToken: params.publicToken,
      },
    });

    if (!result) {
      throw notFound();
    }

    return result;
  },
  component: PublicOrderPage,
});

const statusLabels = {
  pending: "Payment pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

const deliverySteps = [
  {
    key: "paid",
    label: "Order confirmed",
    description: "Your payment was confirmed.",
  },
  {
    key: "processing",
    label: "Being prepared",
    description: "Your order is being prepared.",
  },
  {
    key: "shipped",
    label: "Shipped",
    description: "Your order is on the way.",
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
] as const;

function getCurrentStep(status: keyof typeof statusLabels) {
  if (status === "delivered") return 3;
  if (status === "shipped") return 2;
  if (status === "processing") return 1;
  if (status === "paid") return 0;

  return -1;
}

function PublicOrderPage() {
  const { order, items } = Route.useLoaderData();

  const currentStep = getCurrentStep(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <main className="min-h-screen bg-[#080808] px-4 pb-24 pt-12 text-white md:px-8 lg:px-12">
      <section className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Order tracking
        </p>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black uppercase md:text-5xl">
              {order.orderNumber}
            </h1>

            <p className="mt-3 text-sm text-neutral-500">
              Placed for {order.firstName} {order.lastName}
            </p>
          </div>

          <span
            className={[
              "border px-4 py-2 text-xs font-bold uppercase tracking-[0.15em]",
              isCancelled
                ? "border-red-500/50 text-red-300"
                : order.status === "delivered"
                  ? "border-green-500/50 text-green-300"
                  : "border-white/20 text-white",
            ].join(" ")}
          >
            {statusLabels[order.status]}
          </span>
        </div>

        {isCancelled ? (
          <section className="mt-10 border border-red-500/30 bg-red-500/10 p-5">
            <h2 className="font-bold uppercase">Order cancelled</h2>
            <p className="mt-2 text-sm leading-6 text-red-100/80">
              This order has been cancelled. Contact the store if you need help.
            </p>
          </section>
        ) : (
          <section className="mt-10 border border-white/10 p-5 md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
              Delivery progress
            </p>

            <ol className="mt-8 grid gap-6 md:grid-cols-4">
              {deliverySteps.map((step, index) => {
                const complete = index <= currentStep;
                const current = index === currentStep;

                return (
                  <li key={step.key} className="relative">
                    {index < deliverySteps.length - 1 ? (
                      <span
                        className={[
                          "absolute left-6 top-3 hidden h-px w-[calc(100%-1rem)] md:block",
                          index < currentStep ? "bg-white" : "bg-white/15",
                        ].join(" ")}
                      />
                    ) : null}

                    <div className="relative flex gap-4 md:block">
                      <span
                        className={[
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold",
                          complete
                            ? "border-white bg-white text-black"
                            : "border-white/20 text-neutral-500",
                          current ? "ring-4 ring-white/10" : "",
                        ].join(" ")}
                      >
                        {index + 1}
                      </span>

                      <div className="md:mt-4">
                        <p
                          className={[
                            "text-sm font-bold uppercase",
                            complete ? "text-white" : "text-neutral-500",
                          ].join(" ")}
                        >
                          {step.label}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {order.status === "shipped" || order.status === "delivered" ? (
          <section className="mt-6 border border-white/10 p-5 md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
              Delivery details
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                  Courier
                </p>
                <p className="mt-2 font-medium">
                  {order.courier || "Courier details will be shared soon"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                  Tracking number
                </p>
                <p className="mt-2 break-all font-medium">
                  {order.trackingNumber ||
                    "Tracking details will be shared soon"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h2 className="text-xl font-black uppercase">Items</h2>

            <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex justify-between gap-5 py-5"
                >
                  <div>
                    <h3 className="font-bold uppercase">{item.productName}</h3>

                    <p className="mt-2 text-xs uppercase tracking-[0.1em] text-neutral-500">
                      {item.color} / {item.size} × {item.quantity}
                    </p>

                    <p className="mt-2 text-xs text-neutral-600">
                      SKU: {item.sku}
                    </p>
                  </div>

                  <p className="shrink-0">{formatNaira(item.lineTotalKobo)}</p>
                </article>
              ))}
            </div>
          </div>

          <aside>
            <h2 className="text-xl font-black uppercase">Summary</h2>

            <dl className="mt-5 space-y-4 border border-white/10 p-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{formatNaira(order.subtotalKobo)}</dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Shipping</dt>
                <dd>{formatNaira(order.shippingKobo)}</dd>
              </div>

              <div className="flex justify-between gap-4 border-t border-white/10 pt-4 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatNaira(order.totalKobo)}</dd>
              </div>
            </dl>

            <h2 className="mt-8 text-xl font-black uppercase">Delivery to</h2>

            <address className="mt-5 border border-white/10 p-5 text-sm not-italic leading-7 text-neutral-400">
              <p className="font-medium text-white">
                {order.firstName} {order.lastName}
              </p>
              <p>{order.addressLine1}</p>
              {order.addressLine2 ? <p>{order.addressLine2}</p> : null}
              <p>
                {order.city}, {order.state}
              </p>
              <p>{order.country}</p>
              <p className="mt-3">{order.phone}</p>
            </address>
          </aside>
        </section>
      </section>
    </main>
  );
}
