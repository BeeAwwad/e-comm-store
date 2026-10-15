import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  getAdminProductCollections,
  updateAdminProductCollections,
} from "#/features/admin/collections/server/collections";

export function ProductCollectionEditor({ productId }: { productId: string }) {
  const router = useRouter();

  const [collections, setCollections] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function loadCollections() {
    const result = await getAdminProductCollections({
      data: { productId },
    });

    setCollections(result.collections);
    setSelectedIds(result.selectedCollectionIds);
  }

  useEffect(() => {
    void loadCollections()
      .catch((cause) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load collections.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  function toggleCollection(collectionId: string) {
    setSaved(false);

    setSelectedIds((current) =>
      current.includes(collectionId)
        ? current.filter((id) => id !== collectionId)
        : [...current, collectionId],
    );
  }

  async function saveCollections() {
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const result = await updateAdminProductCollections({
        data: {
          productId,
          collectionIds: selectedIds,
        },
      });

      // The server response is the database truth.
      setSelectedIds(result.selectedCollectionIds);
      setSaved(true);

      await router.invalidate({ sync: true });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save collections.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-white/10 pt-8">
      <div>
        <h2 className="text-xl font-black uppercase">Collections</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Use collections for drops, campaigns, and seasonal releases.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading collections…</p>
      ) : collections.length === 0 ? (
        <p className="text-sm text-neutral-500">Create a collection first.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => {
              const selected = selectedIds.includes(collection.id);

              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => toggleCollection(collection.id)}
                  className={[
                    "border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em]",
                    selected
                      ? "border-white bg-white text-black"
                      : "border-white/20 text-neutral-400 hover:border-white hover:text-white",
                  ].join(" ")}
                >
                  {collection.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveCollections()}
              className="border border-white/20 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save collections"}
            </button>

            {saved ? (
              <span className="text-xs uppercase tracking-[0.12em] text-green-400">
                Saved
              </span>
            ) : null}
          </div>
        </>
      )}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
