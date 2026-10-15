import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/collections")({
  component: CollectionsLayout,
});

function CollectionsLayout() {
  return <Outlet />;
}
