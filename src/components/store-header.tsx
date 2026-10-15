import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useSelector } from "@tanstack/react-store";
import { Menu, ShoppingBag, X } from "lucide-react";
import { cartStore } from "#/features/cart/cart-store";

const navigation = [
  { label: "Shop", to: "/shop/" as const },
  { label: "Collections", to: "/collections/" as const },
];

export function StoreHeader() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items = useSelector(cartStore, (state) => state.items);

  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const cartCount = mounted
    ? items.reduce((total, item) => total + item.quantity, 0)
    : 0;

  function isActive(path: string) {
    if (path === "/shop/") {
      return pathname === "/shop" || pathname.startsWith("/shop/");
    }

    if (path === "/collections/") {
      return (
        pathname === "/collections" || pathname.startsWith("/collections/")
      );
    }

    return pathname === path;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 md:px-8 lg:px-12">
        <Link
          to="/"
          className="text-sm font-black uppercase tracking-[-0.04em] text-white no-underline"
        >
          Your Store
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "text-[11px] font-bold uppercase tracking-[0.18em] no-underline transition",
                isActive(item.to)
                  ? "text-white"
                  : "text-neutral-500 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            aria-label={`Cart with ${cartCount} items`}
            className="relative flex h-10 items-center gap-2 border border-white/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-white no-underline hover:border-white"
          >
            <ShoppingBag size={16} strokeWidth={1.8} />
            <span className="hidden sm:inline">Cart</span>

            {cartCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] text-black">
                {cartCount}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="grid h-10 w-10 place-items-center border border-white/15 md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-white/10 bg-[#080808] px-4 py-5 md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            <Link
              to="/"
              className="border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white no-underline"
            >
              Home
            </Link>

            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white no-underline"
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/cart"
              className="border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white no-underline"
            >
              Cart {cartCount > 0 ? `(${cartCount})` : ""}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
