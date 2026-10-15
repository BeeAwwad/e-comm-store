import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminDashboard } from "#/features/admin/dashboard/server/get-dashboard";
import { formatNaira } from "#/lib/utils";

export const Route = createFileRoute("/admin/_authenticated/")({
  loader: () => getAdminDashboard(),
  component: AdminDashboard,
});

const statusStyles = {
  pending: "border-yellow-500/40 text-yellow-300",
  paid: "border-blue-500/40 text-blue-300",
  processing: "border-purple-500/40 text-purple-300",
  shipped: "border-cyan-500/40 text-cyan-300",
  delivered: "border-green-500/40 text-green-300",
  cancelled: "border-red-500/40 text-red-300",
} as const;

function AdminDashboard() {
  const { adminUser } = Route.useRouteContext();
  const dashboard = Route.useLoaderData();

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.25em] text-red-500">
        Dashboard
      </p>

      <h1 className="mt-4 text-5xl font-black uppercase tracking-[-0.04em]">
        Welcome back
      </h1>

      <p className="mt-4 text-neutral-400">Signed in as {adminUser.email}.</p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active products"
          value={String(dashboard.activeProductCount)}
          href="/admin/products/"
          action="Manage products"
        />

        <MetricCard
          label="Paid orders"
          value={String(dashboard.paidOrderCount)}
          href="/admin/orders/"
          action="View orders"
        />

        <MetricCard
          label="Revenue received"
          value={formatNaira(dashboard.revenueKobo)}
          href="/admin/orders/"
          action="View orders"
        />

        <MetricCard
          label="Needs fulfilment"
          value={String(dashboard.ordersNeedingAction)}
          href="/admin/orders/"
          action="Process orders"
          attention={dashboard.ordersNeedingAction > 0}
        />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="border border-white/10">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <h2 className="font-black uppercase">Recent orders</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Latest customer activity.
              </p>
            </div>

            <Link
              to="/admin/orders/"
              className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400 hover:text-white"
            >
              View all →
            </Link>
          </div>

          {dashboard.recentOrders.length > 0 ? (
            <div className="divide-y divide-white/10">
              {dashboard.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to="/admin/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="flex items-center justify-between gap-4 p-5 no-underline hover:bg-white/5"
                >
                  <div>
                    <p className="font-bold text-white">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {order.firstName} {order.lastName}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatNaira(order.totalKobo)}
                    </p>

                    <span
                      className={[
                        "mt-2 inline-block border px-2 py-1 text-[10px] uppercase tracking-[0.12em]",
                        statusStyles[order.status],
                      ].join(" ")}
                    >
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-8 text-sm text-neutral-500">No orders yet.</p>
          )}
        </section>

        <section className="border border-white/10">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <h2 className="font-black uppercase">Low stock</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Three or fewer available.
              </p>
            </div>

            <Link
              to="/admin/products/"
              className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-400 hover:text-white"
            >
              Products →
            </Link>
          </div>

          {dashboard.lowStockVariants.length > 0 ? (
            <div className="divide-y divide-white/10">
              {dashboard.lowStockVariants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div>
                    <p className="font-medium">{variant.productName}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {variant.size} / {variant.color} · {variant.sku}
                    </p>
                  </div>

                  <p
                    className={[
                      "text-xl font-black",
                      variant.availableStock === 0
                        ? "text-red-400"
                        : "text-yellow-300",
                    ].join(" ")}
                  >
                    {variant.availableStock}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-sm text-neutral-500">
              Inventory levels look healthy.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  href,
  action,
  attention = false,
}: {
  label: string;
  value: string;
  href: "/admin/products/" | "/admin/orders/";
  action: string;
  attention?: boolean;
}) {
  return (
    <Link
      to={href}
      className={[
        "block border p-6 no-underline transition hover:border-white",
        attention ? "border-red-500/40 bg-red-500/5" : "border-white/10",
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </p>

      <p className="mt-4 text-3xl font-black text-white">{value}</p>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
        {action} →
      </p>
    </Link>
  );
}
