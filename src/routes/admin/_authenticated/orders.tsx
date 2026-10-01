import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/orders")({
  component: OrdersLayout,
});

function OrdersLayout() {
  return <Outlet />;
}
