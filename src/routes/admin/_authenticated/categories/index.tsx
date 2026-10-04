import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "#/features/admin/categories/server/categories";

export const Route = createFileRoute("/admin/_authenticated/categories/")({
  loader: () => getAdminCategories(),
  component: CategoriesPage,
});

function CategoriesPage() {
  const categories = Route.useLoaderData();
  const router = useRouter();

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    await router.invalidate({ sync: true });
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setSaving(true);
    setError("");

    try {
      await createAdminCategory({
        data: {
          name: String(form.get("name")),
          slug: String(form.get("slug")),
        },
      });

      event.currentTarget.reset();
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateCategory(
    event: FormEvent<HTMLFormElement>,
    categoryId: string,
  ) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setError("");

    try {
      await updateAdminCategory({
        data: {
          categoryId,
          name: String(form.get("name")),
          slug: String(form.get("slug")),
        },
      });

      setEditingId(null);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update category.",
      );
    }
  }

  async function removeCategory(categoryId: string) {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    setError("");

    try {
      await deleteAdminCategory({
        data: { categoryId },
      });

      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete category.",
      );
    }
  }

  return (
    <section className="max-w-4xl">
      <p className="text-xs uppercase tracking-[0.25em] text-red-500">
        Catalog
      </p>

      <h1 className="mt-3 text-4xl font-black uppercase">Categories</h1>

      <form
        onSubmit={createCategory}
        className="mt-10 grid gap-3 border border-white/10 p-5 md:grid-cols-[1fr_1fr_auto]"
      >
        <input
          required
          name="name"
          placeholder="Category name, e.g. Jerseys"
          className="border border-white/15 bg-transparent px-4 py-3 text-sm"
        />

        <input
          required
          name="slug"
          placeholder="jerseys"
          className="border border-white/15 bg-transparent px-4 py-3 text-sm"
        />

        <button
          type="submit"
          disabled={saving}
          className="bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black disabled:opacity-50"
        >
          {saving ? "Creating…" : "Add category"}
        </button>
      </form>

      {error ? (
        <p className="mt-5 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
        {categories.map((category) =>
          editingId === category.id ? (
            <form
              key={category.id}
              onSubmit={(event) => updateCategory(event, category.id)}
              className="grid gap-3 py-4 md:grid-cols-[1fr_1fr_auto_auto]"
            >
              <input
                required
                name="name"
                defaultValue={category.name}
                className="border border-white/15 bg-transparent px-3 py-2 text-sm"
              />

              <input
                required
                name="slug"
                defaultValue={category.slug}
                className="border border-white/15 bg-transparent px-3 py-2 text-sm"
              />

              <button
                type="submit"
                className="border border-white/20 px-4 py-2 text-xs uppercase"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-xs uppercase text-neutral-400"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  /{category.slug}
                </p>
              </div>

              <div className="flex gap-4 text-xs font-bold uppercase tracking-[0.12em]">
                <button type="button" onClick={() => setEditingId(category.id)}>
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => void removeCategory(category.id)}
                  className="text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ),
        )}

        {categories.length === 0 ? (
          <p className="py-8 text-sm text-neutral-500">No categories yet.</p>
        ) : null}
      </div>
    </section>
  );
}
