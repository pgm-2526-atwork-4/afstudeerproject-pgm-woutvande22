"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { ImagePreview } from "@/app/components/dashboard/ImagePreview";
import { ImageDetailsForm } from "@/app/components/dashboard/ImageDetailsForm";
import { type Photo, fetchPhotos } from "@/app/lib/photos";

export default function ImageDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const collection = searchParams.get("collection") ?? undefined;

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchPhotos(token)
      .then((photos) => {
        const ids = photos.map((p) => String(p.id));
        setAllIds(ids);
        const found = photos.find((p) => String(p.id) === id);
        setPhoto(found ?? null);
      })
      .catch((err) => console.error("Failed to load photo:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // Compute prev/next
  const currentIndex = allIds.indexOf(id);
  const collectionParam = collection ? `?collection=${collection}` : "";
  const prevHref =
    currentIndex > 0
      ? `/dashboard/${allIds[currentIndex - 1]}${collectionParam}`
      : undefined;
  const nextHref =
    currentIndex >= 0 && currentIndex < allIds.length - 1
      ? `/dashboard/${allIds[currentIndex + 1]}${collectionParam}`
      : undefined;

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Image not found.</p>
        <Link href="/dashboard" className="text-sky-500 hover:text-sky-600 text-sm mt-2 inline-block">
          ← Back to All Images
        </Link>
      </div>
    );
  }

  return (
    <article className="p-8">
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Image Details"
          description="Edit and manage your image details"
        />
        <Link
          href={collection ? `/dashboard/collections/${collection}` : "/dashboard"}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {collection ? "← Back to Collection" : "← Back to All Images"}
        </Link>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        <ImagePreview
          url={photo.url}
          alt={`Photo ${photo.id}`}
          prevHref={prevHref}
          nextHref={nextHref}
        />

        <div className="flex-1">
          <ImageDetailsForm
            title={`Photo ${photo.id}`}
            size={`${photo.file_size_mb} MB`}
            tags={[]}
          />
        </div>
      </div>
    </article>
  );
}
