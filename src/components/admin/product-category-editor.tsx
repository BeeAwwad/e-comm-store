import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  getAdminProductCategories,
  updateAdminProductCategories,
} from "#/features/admin/categories/server/categories";

export function ProductCategoryEditor({ productId }: { productId: string }) {
  const router = useRouter();

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await getAdminProductCategories({
          data: { productId },
        });

        setCategories(result.categories);
        setSelectedIds(result.selectedCategoryIds);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not load categories.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCategories();
  }, [productId]);

  function toggleCategory(categoryId: string) {
    setSelectedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  }

  async function saveCategories() {
    setSaving(true);
    setError("");

    try {
      await updateAdminProductCategories({
        data: {
          productId,
          categoryIds: selectedIds,
        },
      });

      await router.invalidate({ sync: true });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save categories.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-white/10 pt-8">
      <div>
        <h2 className="text-xl font-black uppercase">Categories</h2>
        <p className="mt-1 text-sm text-neutral-500">
          A product can belong to more than one category.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Create categories first in the Categories admin page.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = selectedIds.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={[
                    "border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em]",
                    selected
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-neutral-400 hover:border-white hover:text-white",
                  ].join(" ")}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void saveCategories()}
            disabled={saving}
            className="border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save categories"}
          </button>
        </>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
