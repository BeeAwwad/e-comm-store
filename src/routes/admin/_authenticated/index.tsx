import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { adminUser } = Route.useRouteContext();

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.25em] text-red-500">
        Dashboard
      </p>

      <h1 className="mt-4 text-5xl font-black uppercase tracking-[-0.04em]">
        Welcome back
      </h1>

      <p className="mt-4 text-neutral-400">Signed in as {adminUser.email}.</p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <article className="border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Products
          </p>

          <p className="mt-4 text-3xl font-black">—</p>
        </article>

        <article className="border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Paid orders
          </p>

          <p className="mt-4 text-3xl font-black">—</p>
        </article>

        <article className="border border-white/10 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Low stock
          </p>

          <p className="mt-4 text-3xl font-black">—</p>
        </article>
      </div>
    </section>
  );
}
