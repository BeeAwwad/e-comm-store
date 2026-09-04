import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shop/$productSlug")({
  component: ProductPage,
});

function ProductPage() {
  const { productSlug } = Route.useParams();

  return (
    <main className="grid min-h-screen place-items-center bg-[#080808] px-6 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-red-500">
          Product
        </p>

        <h1 className="mt-3 text-4xl font-black uppercase">
          {productSlug.replaceAll("-", " ")}
        </h1>
      </div>
    </main>
  );
}