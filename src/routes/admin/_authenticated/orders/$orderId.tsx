import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";

import {
  getAdminOrder,
  updateAdminOrderFulfillment,
} from "#/features/admin/orders/server/orders";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/admin/_authenticated/orders/$orderId")({
  loader: async ({ params }) => {
    const result = await getAdminOrder({
      data: {
        orderId: params.orderId,
      },
    });

    if (!result) {
      throw notFound();
    }

    return result;
  },
  component: OrderDetailPage,
});

function statusClass(status: string) {
  const styles: Record<string, string> = {
    pending: "border-yellow-400/40 text-yellow-300",
    paid: "border-blue-400/40 text-blue-300",
    processing: "border-purple-400/40 text-purple-300",
    shipped: "border-cyan-400/40 text-cyan-300",
    delivered: "border-green-400/40 text-green-300",
    cancelled: "border-red-400/40 text-red-300",
  };

  return styles[status] ?? "border-white/20 text-white";
}

function OrderDetailPage() {
  const { order, items, payments } = Route.useLoaderData();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFulfillmentUpdate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setSaving(true);
    setError("");

    try {
      await updateAdminOrderFulfillment({
        data: {
          orderId: order.id,
          status: String(form.get("status")) as
            | "pending"
            | "paid"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled",
          courier: String(form.get("courier")).trim() || null,
          trackingNumber: String(form.get("trackingNumber")).trim() || null,
          adminNotes: String(form.get("adminNotes")).trim() || null,
        },
      });

      await router.invalidate({
        sync: true,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update order.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-red-500">
            Order detail
          </p>

          <h1 className="mt-3 text-4xl font-black uppercase">
            {order.orderNumber}
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Created{" "}
            {new Intl.DateTimeFormat("en-NG", {
              dateStyle: "full",
              timeStyle: "short",
            }).format(new Date(order.createdAt))}
          </p>
        </div>

        <span
          className={`border px-3 py-2 text-xs uppercase tracking-[0.15em] ${statusClass(
            order.status,
          )}`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="border border-white/10 p-6">
            <h2 className="text-xl font-black uppercase">Items</h2>

            <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex justify-between gap-5 py-5"
                >
                  <div>
                    <h3 className="font-medium uppercase">
                      {item.productName}
                    </h3>

                    <p className="mt-2 text-xs uppercase text-neutral-500">
                      {item.color} / {item.size} · {item.sku} · ×{item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p>{formatNaira(item.lineTotalKobo)}</p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {formatNaira(item.unitPriceKobo)} each
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <dl className="ml-auto mt-6 max-w-xs space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{formatNaira(order.subtotalKobo)}</dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-neutral-500">Shipping</dt>
                <dd>{formatNaira(order.shippingKobo)}</dd>
              </div>

              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatNaira(order.totalKobo)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-white/10 p-6">
            <h2 className="text-xl font-black uppercase">Payment</h2>

            <div className="mt-6 space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="border border-white/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium capitalize">{payment.provider}</p>

                    <span className="text-xs uppercase text-neutral-400">
                      {payment.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm">
                    {formatNaira(payment.amountKobo)}
                  </p>

                  <dl className="mt-4 space-y-2 text-xs text-neutral-500">
                    <div>
                      <dt className="inline">Reference: </dt>
                      <dd className="inline break-all">{payment.reference}</dd>
                    </div>

                    {payment.channel && (
                      <div>
                        <dt className="inline">Channel: </dt>
                        <dd className="inline">{payment.channel}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="border border-white/10 p-6">
            <h2 className="text-xl font-black uppercase">Customer</h2>

            <div className="mt-6 space-y-3 text-sm">
              <p>
                {order.firstName} {order.lastName}
              </p>

              <p className="text-neutral-400">{order.email}</p>

              <p className="text-neutral-400">{order.phone}</p>
            </div>
          </section>

          <section className="border border-white/10 p-6">
            <h2 className="text-xl font-black uppercase">Delivery address</h2>

            <address className="mt-6 whitespace-pre-line text-sm not-italic leading-6 text-neutral-300">
              {order.addressLine1}
              {order.addressLine2 && `\n${order.addressLine2}`}
              {`\n${order.city}, ${order.state}`}
              {`\n${order.country}`}
            </address>
          </section>

          <form
            onSubmit={handleFulfillmentUpdate}
            className="border border-white/10 p-6"
          >
            <h2 className="text-xl font-black uppercase">Fulfillment</h2>

            <div className="mt-6 space-y-5">
              <label className="grid gap-2 text-sm">
                Status
                <select
                  name="status"
                  defaultValue={order.status}
                  className="border border-white/15 bg-[#080808] px-4 py-3"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                Courier
                <input
                  name="courier"
                  defaultValue={order.courier ?? ""}
                  placeholder="DHL, GIG Logistics, etc."
                  className="border border-white/15 bg-transparent px-4 py-3"
                />
              </label>

              <label className="grid gap-2 text-sm">
                Tracking number
                <input
                  name="trackingNumber"
                  defaultValue={order.trackingNumber ?? ""}
                  placeholder="Tracking code"
                  className="border border-white/15 bg-transparent px-4 py-3"
                />
              </label>

              <label className="grid gap-2 text-sm">
                Internal notes
                <textarea
                  name="adminNotes"
                  rows={5}
                  defaultValue={order.adminNotes ?? ""}
                  placeholder="Never shown to the customer."
                  className="border border-white/15 bg-transparent px-4 py-3"
                />
              </label>
            </div>

            {order.shippedAt && (
              <p className="mt-5 text-xs text-neutral-500">
                Shipped:{" "}
                {new Intl.DateTimeFormat("en-NG", {
                  dateStyle: "medium",
                }).format(new Date(order.shippedAt))}
              </p>
            )}

            {order.deliveredAt && (
              <p className="mt-2 text-xs text-neutral-500">
                Delivered:{" "}
                {new Intl.DateTimeFormat("en-NG", {
                  dateStyle: "medium",
                }).format(new Date(order.deliveredAt))}
              </p>
            )}

            {error && (
              <p className="mt-5 border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full bg-red-600 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] hover:bg-red-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save fulfillment"}
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
