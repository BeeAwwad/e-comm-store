import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/categories")({
  component: CategoriesLayout,
});

function CategoriesLayout() {
  return <Outlet />;
}
