import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/products")({
  component: ProductsLayout,
});

function ProductsLayout() {
  return <Outlet />;
}
