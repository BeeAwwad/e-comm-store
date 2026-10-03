import { createFileRoute, Link } from "@tanstack/react-router";

import { getAdminOrders } from "#/features/admin/orders/server/orders";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/admin/_authenticated/orders/")({
  loader: () => getAdminOrders(),
  component: OrdersPage,
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

export function OrdersPage() {
  const orders = Route.useLoaderData();

  return (
    <section>
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Operations
        </p>

        <h1 className="mt-3 text-4xl font-black uppercase">Orders</h1>

        <p className="mt-3 text-sm text-neutral-500">
          {orders.length} order
          {orders.length === 1 ? "" : "s"} total
        </p>
      </div>

      <div className="mt-10 overflow-x-auto border border-white/10">
        <table className="w-full min-w-220 text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-neutral-500">
            <tr>
              <th className="px-5 py-4 font-medium">Order</th>
              <th className="px-5 py-4 font-medium">Customer</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Total</th>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 font-medium" />
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-4 font-medium">{order.orderNumber}</td>

                <td className="px-5 py-4">
                  <p>
                    {order.firstName} {order.lastName}
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">{order.email}</p>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${statusClass(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="px-5 py-4">{formatNaira(order.totalKobo)}</td>

                <td className="px-5 py-4 text-neutral-400">
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(order.createdAt))}
                </td>

                <td className="px-5 py-4 text-right">
                  <Link
                    to="/admin/orders/$orderId"
                    params={{
                      orderId: order.id,
                    }}
                    className="text-xs uppercase tracking-[0.14em] text-neutral-400 hover:text-white"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-16 text-center text-neutral-500"
                >
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
