"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/app/components/dashboard/layout/PageHeader";
import { BackButton } from "@/app/components/ui/BackButton";
import { LoadingCircle } from "@/app/components/ui/LoadingCircle";
import { ImagePreview } from "@/app/components/dashboard/images/ImagePreview";
import { ImageDetailsForm } from "@/app/components/dashboard/images/ImageDetailsForm";
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
import { dispatchSidebarCountsChanged } from "@/app/lib/events";

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
      const cached = prefetchCache.current.get(photo.id);

      // Show cached values immediately when available to avoid visible lag.
      if (cached?.tags) {
        setPhotoTags(cached.tags);
      }
      if (cached?.collections) {
        setPhotoCollections(cached.collections);
      }

      setTagsLoading(!cached?.tags);
      setCollectionsLoading(!cached?.collections);

      const tagsPromise = (async () => {
        const pTags = cached?.tags ? cached.tags : await getPhotoTags(token, photo.id);

        if (!allTagsFetched.current) {
          const fetchedAllTags = await fetchTags(token);
          if (!cancelled) {
            setAllTags(fetchedAllTags);
            allTagsFetched.current = true;
          }
        }

        if (!cancelled) {
          setPhotoTags(pTags);
          setTagsLoading(false);
        }
      })();

      const collectionsPromise = (async () => {
        const cols = cached?.collections
          ? cached.collections
          : await fetchCollectionsForPhoto(token, photo.id);

        if (!cancelled) {
          setPhotoCollections(cols);
          setCollectionsLoading(false);
        }
      })();

      try {
        await Promise.all([tagsPromise, collectionsPromise]);
      } catch (err) {
        console.error("Failed to load image data:", err);
      } finally {
        if (!cancelled) {
          // Ensure both loaders are reset even when one request fails.
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
      dispatchSidebarCountsChanged();
    } catch (err) {
      console.error("Failed to create tag:", err);
    }
  }, [photo]);

  const handleGenerateTags = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !photo) return;

    const result = await getAiTagsForPhoto(token, photo.id);

    // Save the AI description to the photo
    if (result.description) {
      const updated = await updatePhoto(token, photo.id, { description: result.description });
      setAllPhotos((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }

    const normalizedNames = Array.from(
      new Set(
        result.tags
          .map((name) => name.trim().toLowerCase())
          .filter((name) => name.length > 0)
      )
    );

    const knownTagsByName = new Map(allTags.map((tag) => [tag.name.toLowerCase(), tag]));
    const photoTagIds = new Set(photoTags.map((tag) => tag.id));
    const createdTags: Tag[] = [];
    const newlyLinkedTags: Tag[] = [];

    for (const normalizedName of normalizedNames) {
      let tag = knownTagsByName.get(normalizedName);

      if (!tag) {
        tag = await createTag(token, normalizedName, DEFAULT_COLOR);
        knownTagsByName.set(normalizedName, tag);
        createdTags.push(tag);
      }

      if (photoTagIds.has(tag.id)) {
        continue;
      }

      await addTagToPhoto(token, photo.id, tag.id);
      photoTagIds.add(tag.id);
      newlyLinkedTags.push(tag);
    }

    if (createdTags.length > 0) {
      setAllTags((prev) => {
        const mergedById = new Map(prev.map((tag) => [tag.id, tag]));
        createdTags.forEach((tag) => mergedById.set(tag.id, tag));
        return Array.from(mergedById.values());
      });
      dispatchSidebarCountsChanged();
    }

    if (newlyLinkedTags.length > 0) {
      setPhotoTags((prev) => {
        const mergedById = new Map(prev.map((tag) => [tag.id, tag]));
        newlyLinkedTags.forEach((tag) => mergedById.set(tag.id, tag));
        return Array.from(mergedById.values());
      });
    }
  }, [photo, allTags, photoTags]);

  // Preload adjacent image files
  const prevPhoto = currentIndex > 0 ? allPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < allPhotos.length - 1 ? allPhotos[currentIndex + 1] : null;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allIds.length - 1;
  const isDetailDataLoading = tagsLoading || collectionsLoading;

  if (initialLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500 text-sm">
        <LoadingCircle size="md" label="Loading image details" />
        <p>Loading image details...</p>
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
        {isDetailDataLoading && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
            <LoadingCircle size="sm" label="Fetching image data" />
            Fetching image data...
          </div>
        )}
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
            description={photo.description}
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
