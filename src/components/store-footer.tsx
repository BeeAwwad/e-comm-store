import { Link } from "@tanstack/react-router";

export function StoreFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080808] px-4 py-12 text-white md:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-lg font-black uppercase tracking-[-0.04em]">
            Your Store
          </p>

          <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
            Independent clothing pieces made for everyday expression.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
            Browse
          </p>

          <div className="mt-4 grid gap-3 text-sm">
            <Link
              to="/shop/"
              className="w-fit text-neutral-500 no-underline hover:text-white"
            >
              Shop
            </Link>

            <Link
              to="/collections/"
              className="w-fit text-neutral-500 no-underline hover:text-white"
            >
              Collections
            </Link>

            <Link
              to="/cart"
              className="w-fit text-neutral-500 no-underline hover:text-white"
            >
              Cart
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
            Need help?
          </p>

          <div className="mt-4 grid gap-3 text-sm text-neutral-500">
            <a href="mailto:hello@yourstore.com">hello@yourstore.com</a>
            <p>Orders are paid securely with Paystack.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.14em] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Your Store</p>
        <p>All rights reserved</p>
      </div>
    </footer>
  );
}
