"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { ImagePreview } from "@/app/components/dashboard/ImagePreview";
import { ImageDetailsForm } from "@/app/components/dashboard/ImageDetailsForm";
import { type Photo, fetchPhotos, updatePhoto } from "@/app/lib/photos";
import {
  type Tag,
  getPhotoTags,
  fetchTags,
  addTagToPhoto,
  removeTagFromPhoto,
  createTag,
} from "@/app/lib/tags";
import {
  fetchCollectionsForPhoto,
  type Collection,
} from "@/app/lib/collections";

const DEFAULT_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#06B6D4",
];

export default function ImageDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const collection = searchParams.get("collection") ?? undefined;

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Tag state
  const [photoTags, setPhotoTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Collection state
  const [photoCollections, setPhotoCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Load photo data
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

  // Load tags when photo is available
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    const loadTags = async () => {
      setTagsLoading(true);
      try {
        const [pTags, aTags] = await Promise.all([
          getPhotoTags(token, photo.id),
          fetchTags(token),
        ]);
        setPhotoTags(pTags);
        setAllTags(aTags);
      } catch (err) {
        console.error("Failed to load tags:", err);
      } finally {
        setTagsLoading(false);
      }
    };

    loadTags();
  }, [photo]);

  // Load collections for this photo
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    const loadCollections = async () => {
      setCollectionsLoading(true);
      try {
        const cols = await fetchCollectionsForPhoto(token, photo.id);
        setPhotoCollections(cols);
      } catch (err) {
        console.error("Failed to load collections:", err);
      } finally {
        setCollectionsLoading(false);
      }
    };

    loadCollections();
  }, [photo]);

  const handleSave = useCallback(async (title: string) => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    const updated = await updatePhoto(token, photo.id, { title });
    setPhoto(updated);
  }, [photo]);

  const handleCancel = useCallback(() => {
    router.push(collection ? `/dashboard/collections/${collection}` : "/dashboard");
  }, [router, collection]);

  const handleAddTag = useCallback(async (tag: Tag) => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    try {
      await addTagToPhoto(token, photo.id, tag.id);
      setPhotoTags((prev) => [...prev, tag]);
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
  }, [photo]);

  const handleRemoveTag = useCallback(async (tagId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    try {
      await removeTagFromPhoto(token, photo.id, tagId);
      setPhotoTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  }, [photo]);

  const handleCreateTag = useCallback(async (name: string) => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    try {
      const color = DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
      const newTag = await createTag(token, name, color);
      // Add to the global list and attach to this photo
      setAllTags((prev) => [...prev, newTag]);
      await addTagToPhoto(token, photo.id, newTag.id);
      setPhotoTags((prev) => [...prev, newTag]);
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  }, [photo]);

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
            title={photo.title || `Photo ${photo.id}`}
            size={`${photo.file_size_mb} MB`}
            uploadedAt={photo.created_at}
            tags={photoTags}
            allTags={allTags}
            tagsLoading={tagsLoading}
            collections={photoCollections}
            collectionsLoading={collectionsLoading}
            onSave={handleSave}
            onCancel={handleCancel}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onCreateTag={handleCreateTag}
          />
        </div>
      </div>
    </article>
  );
}
