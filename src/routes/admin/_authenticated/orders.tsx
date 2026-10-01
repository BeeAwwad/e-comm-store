import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <section>
      <h1 className="text-4xl font-black uppercase">Orders</h1>

      <p className="mt-4 text-neutral-400">
        Order management is the checkpoint after products.
      </p>
    </section>
  );
}
