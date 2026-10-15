import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import {
  createAdminCollection,
  getAdminCollections,
  updateAdminCollection,
} from "#/features/admin/collections/server/collections";

export const Route = createFileRoute("/admin/_authenticated/collections/")({
  loader: () => getAdminCollections(),
  component: CollectionsPage,
});

function CollectionsPage() {
  const collections = Route.useLoaderData();
  const router = useRouter();

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    await router.invalidate({ sync: true });
  }

  async function createCollection(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setSaving(true);
    setError("");

    try {
      await createAdminCollection({
        data: {
          name: String(form.get("name")),
          slug: String(form.get("slug")),
          description: String(form.get("description")),
          published: form.get("published") === "on",
        },
      });

      formElement.reset();
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create collection.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCollection(
    event: SubmitEvent<HTMLFormElement>,
    collectionId: string,
  ) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    setError("");

    try {
      await updateAdminCollection({
        data: {
          collectionId,
          name: String(form.get("name")),
          slug: String(form.get("slug")),
          description: String(form.get("description")),
          published: form.get("published") === "on",
          archived: form.get("archived") === "on",
        },
      });

      setEditingId(null);
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update collection.",
      );
    }
  }

  return (
    <section className="max-w-4xl">
      <p className="text-xs uppercase tracking-[0.25em] text-red-500">
        Catalog
      </p>

      <h1 className="mt-3 text-4xl font-black uppercase">Collections</h1>

      <form
        onSubmit={createCollection}
        className="mt-10 grid gap-4 border border-white/10 p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input
            required
            name="name"
            placeholder="Collection name, e.g. Summer 2026"
            className="border border-white/15 bg-transparent px-4 py-3 text-sm"
          />

          <input
            required
            name="slug"
            placeholder="summer-2026"
            className="border border-white/15 bg-transparent px-4 py-3 text-sm"
          />
        </div>

        <textarea
          name="description"
          rows={3}
          placeholder="Short description for this collection"
          className="border border-white/15 bg-transparent px-4 py-3 text-sm"
        />

        <label className="flex items-center gap-3 text-sm">
          <input name="published" type="checkbox" />
          Publish immediately
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-fit bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create collection"}
        </button>
      </form>

      {error ? (
        <p className="mt-5 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-4">
        {collections.map((collection) =>
          editingId === collection.id ? (
            <form
              key={collection.id}
              onSubmit={(event) => saveCollection(event, collection.id)}
              className="grid gap-4 border border-white/10 p-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  name="name"
                  defaultValue={collection.name}
                  className="border border-white/15 bg-transparent px-4 py-3 text-sm"
                />

                <input
                  required
                  name="slug"
                  defaultValue={collection.slug}
                  className="border border-white/15 bg-transparent px-4 py-3 text-sm"
                />
              </div>

              <textarea
                name="description"
                rows={3}
                defaultValue={collection.description}
                className="border border-white/15 bg-transparent px-4 py-3 text-sm"
              />

              <label className="flex items-center gap-3 text-sm">
                <input
                  name="published"
                  type="checkbox"
                  defaultChecked={Boolean(collection.publishedAt)}
                />
                Published
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  name="archived"
                  type="checkbox"
                  defaultChecked={collection.archived}
                />
                Archived
              </label>

              <div className="flex gap-4">
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
              </div>
            </form>
          ) : (
            <article
              key={collection.id}
              className="flex items-start justify-between gap-6 border border-white/10 p-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold uppercase">{collection.name}</h2>

                  {collection.archived ? (
                    <span className="border border-red-500/40 px-2 py-1 text-[10px] uppercase text-red-300">
                      Archived
                    </span>
                  ) : collection.publishedAt ? (
                    <span className="border border-green-500/40 px-2 py-1 text-[10px] uppercase text-green-300">
                      Published
                    </span>
                  ) : (
                    <span className="border border-white/20 px-2 py-1 text-[10px] uppercase text-neutral-400">
                      Draft
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-neutral-400">
                  {collection.description || "No description yet."}
                </p>

                <p className="mt-3 text-xs text-neutral-600">
                  /{collection.slug}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingId(collection.id)}
                className="text-xs font-bold uppercase tracking-[0.12em]"
              >
                Edit
              </button>
            </article>
          ),
        )}

        {collections.length === 0 ? (
          <p className="border border-white/10 p-8 text-sm text-neutral-500">
            No collections yet.
          </p>
        ) : null}
      </div>
    </section>
  );
}
