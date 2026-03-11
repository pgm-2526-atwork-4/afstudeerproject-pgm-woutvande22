"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { BackButton } from "@/app/components/ui/BackButton";
import { ImagePreview } from "@/app/components/dashboard/ImagePreview";
import { ImageDetailsForm } from "@/app/components/dashboard/ImageDetailsForm";
import { type Photo, fetchPhotos, updatePhoto, getAiTagsForPhoto } from "@/app/lib/photos";
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

const DEFAULT_COLOR = "#3B82F6";

export default function ImageDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const collection = searchParams.get("collection") ?? undefined;

  // ── Current photo is tracked by state, not by the URL param ──
  const [currentId, setCurrentId] = useState(params.id);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Tag state
  const [photoTags, setPhotoTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Collection state
  const [photoCollections, setPhotoCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);

  // Cache for prefetched data (keyed by photo id)
  const prefetchCache = useRef<
    Map<number, { tags?: Tag[]; collections?: Collection[] }>
  >(new Map());
  const allTagsFetched = useRef(false);

  // ── 1. Fetch the photo list ONCE and cache it ──
  useEffect(() => {
    if (photosLoaded) return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setInitialLoading(false);
      return;
    }

    fetchPhotos(token)
      .then((photos) => {
        setAllPhotos(photos);
        setPhotosLoaded(true);
      })
      .catch((err) => console.error("Failed to load photos:", err))
      .finally(() => setInitialLoading(false));
  }, [photosLoaded]);

  // Derive current photo & id list from cached list
  const photo = useMemo(
    () => allPhotos.find((p) => String(p.id) === currentId) ?? null,
    [allPhotos, currentId]
  );
  const allIds = useMemo(() => allPhotos.map((p) => String(p.id)), [allPhotos]);
  const currentIndex = allIds.indexOf(currentId);

  // ── Navigate prev/next without remounting ──
  const goToPhoto = useCallback(
    (targetId: string) => {
      setCurrentId(targetId);
      // Update the URL bar without a full navigation / remount
      const collectionParam = collection ? `?collection=${collection}` : "";
      window.history.replaceState(null, "", `/dashboard/${targetId}${collectionParam}`);
    },
    [collection]
  );

  const goPrev = useCallback(() => {
    if (currentIndex > 0) goToPhoto(allIds[currentIndex - 1]);
  }, [currentIndex, allIds, goToPhoto]);

  const goNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < allIds.length - 1) goToPhoto(allIds[currentIndex + 1]);
  }, [currentIndex, allIds, goToPhoto]);

  // ── 2. Load tags + collections IN PARALLEL, using prefetch cache if available ──
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    let cancelled = false;

    const loadData = async () => {
      setTagsLoading(true);
      setCollectionsLoading(true);

      const cached = prefetchCache.current.get(photo.id);

      try {
        const [pTags, aTags, cols] = await Promise.all([
          cached?.tags ? Promise.resolve(cached.tags) : getPhotoTags(token, photo.id),
          allTagsFetched.current ? Promise.resolve(allTags) : fetchTags(token),
          cached?.collections
            ? Promise.resolve(cached.collections)
            : fetchCollectionsForPhoto(token, photo.id),
        ]);

        if (cancelled) return;

        setPhotoTags(pTags);
        if (!allTagsFetched.current) {
          setAllTags(aTags);
          allTagsFetched.current = true;
        }
        setPhotoCollections(cols);
      } catch (err) {
        console.error("Failed to load image data:", err);
      } finally {
        if (!cancelled) {
          setTagsLoading(false);
          setCollectionsLoading(false);
        }
      }
    };

    loadData();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo?.id]);

  // ── 3. Prefetch adjacent image data in the background ──
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || allIds.length === 0) return;

    const adjacentIds: number[] = [];
    if (currentIndex > 0) adjacentIds.push(Number(allIds[currentIndex - 1]));
    if (currentIndex < allIds.length - 1) adjacentIds.push(Number(allIds[currentIndex + 1]));

    adjacentIds.forEach((adjId) => {
      if (prefetchCache.current.has(adjId)) return;
      prefetchCache.current.set(adjId, {});

      Promise.all([
        getPhotoTags(token, adjId),
        fetchCollectionsForPhoto(token, adjId),
      ])
        .then(([tags, collections]) => {
          prefetchCache.current.set(adjId, { tags, collections });
        })
        .catch(() => {
          prefetchCache.current.delete(adjId);
        });
    });
  }, [currentId, allIds, currentIndex]);

  const handleSave = useCallback(async (title: string) => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    const updated = await updatePhoto(token, photo.id, { title });
    setAllPhotos((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
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
      const newTag = await createTag(token, name, DEFAULT_COLOR);
      setAllTags((prev) => [...prev, newTag]);
      await addTagToPhoto(token, photo.id, newTag.id);
      setPhotoTags((prev) => [...prev, newTag]);
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  }, [photo]);

  const handleGenerateTags = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    const result = await getAiTagsForPhoto(token, photo.id);

    for (const tagName of result.tags) {
      const existing = allTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (existing) {
        // Skip if already on the photo
        if (photoTags.some((t) => t.id === existing.id)) continue;
        await addTagToPhoto(token, photo.id, existing.id);
        setPhotoTags((prev) => [...prev, existing]);
      } else {
        const newTag = await createTag(token, tagName, DEFAULT_COLOR);
        setAllTags((prev) => [...prev, newTag]);
        await addTagToPhoto(token, photo.id, newTag.id);
        setPhotoTags((prev) => [...prev, newTag]);
      }
    }
  }, [photo, allTags, photoTags]);

  // Preload adjacent image files
  const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allIds.length - 1;

  if (initialLoading) {
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
        <div className="mt-2">
          <BackButton href="/dashboard" label="Back to All Images" />
        </div>
      </div>
    );
  }

  return (
    <article className="p-8">
      <div className="mb-4">
        <BackButton
          href={collection ? `/dashboard/collections/${collection}` : "/dashboard"}
          label={collection ? "Back to Collection" : "Back to All Images"}
        />
      </div>

      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Image Details"
          description="Edit and manage your image details"
        />
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        <ImagePreview
          url={photo.url}
          alt={`Photo ${photo.id}`}
          onPrev={hasPrev ? goPrev : undefined}
          onNext={hasNext ? goNext : undefined}
        />

        <div className="flex-1">
          <ImageDetailsForm
            key={photo.id}
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
            onGenerateTags={handleGenerateTags}
          />
        </div>
      </div>

      {/* Preload adjacent images for instant navigation */}
      <div className="hidden" aria-hidden>
        {prevPhoto?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prevPhoto.url} alt="" />
        )}
        {nextPhoto?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={nextPhoto.url} alt="" />
        )}
      </div>
    </article>
  );
}
