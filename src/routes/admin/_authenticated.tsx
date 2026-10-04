import { authClient } from "#/lib/auth-client";
import { getAdminSession } from "#/lib/auth.functions";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_authenticated")({
  beforeLoad: async () => {
    const session = await getAdminSession();

    if (!session) {
      throw redirect({
        to: "/admin/login",
      });
    }

    return {
      adminUser: session.user,
    };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const { adminUser } = Route.useRouteContext();

  async function handleSignOut() {
    await authClient.signOut();

    await navigate({
      to: "/admin/login",
    });
  }
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link to="/admin" className="font-black uppercase tracking-tight">
            Store Admin
          </Link>

          <nav className="hidden items-center gap-5 text-xs uppercase tracking-[0.15em] text-neutral-400 md:flex">
            <Link to="/admin">Overview</Link>
            <Link to="/admin/products/">Products</Link>
            <Link to="/admin/orders/">Orders</Link>
            <Link to="/admin/categories/">Categories</Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-neutral-500 sm:block">
              {adminUser.email}
            </span>

            <button
              type="button"
              onClick={handleSignOut}
              className="border border-white/20 px-3 py-2 text-[10px] uppercase tracking-[0.15em] hover:border-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
