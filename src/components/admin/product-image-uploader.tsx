import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  deleteAdminProductImage,
  prepareProductImageUpload,
  saveAdminProductImage,
} from "#/features/admin/products/server/products";

type ProductImage = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export function ProductImageUploader({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Images must be 8 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadConfig = await prepareProductImageUpload({
        data: { productId },
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", uploadConfig.apiKey);
      formData.append("timestamp", String(uploadConfig.timestamp));
      formData.append("folder", uploadConfig.folder);
      formData.append("signature", uploadConfig.signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadConfig.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "Cloudinary upload failed.");
      }

      await saveAdminProductImage({
        data: {
          productId,
          url: result.secure_url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
        },
      });

      await router.invalidate({ sync: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not upload the image.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(imageId: string) {
    try {
      await deleteAdminProductImage({
        data: { productId, imageId },
      });

      await router.invalidate({ sync: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not remove the image.",
      );
    }
  }

  return (
    <section className="space-y-4 border-t border-neutral-800 pt-8">
      <div>
        <h2 className="text-xl font-bold uppercase">Product images</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Upload the primary image first.
        </p>
      </div>

      <label className="flex w-fit cursor-pointer items-center bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black">
        {uploading ? "Uploading…" : "Upload image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void uploadImage(file);
            }

            event.target.value = "";
          }}
        />
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {images.length === 0 ? (
        <p className="text-sm text-neutral-500">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.map((image) => (
            <figure key={image.id} className="space-y-2">
              <img
                src={image.url}
                alt={image.alt}
                className="aspect-square w-full bg-neutral-900 object-cover"
              />

              <button
                type="button"
                onClick={() => void removeImage(image.id)}
                className="text-xs font-bold uppercase tracking-[0.12em] text-red-400"
              >
                Remove
              </button>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
