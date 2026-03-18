"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/app/components/dashboard/layout/PageHeader";
import { UploadButton } from "@/app/components/dashboard/images/UploadButton";
import { SearchFilterBar, type CollectionFilter } from "@/app/components/dashboard/images/SearchbarFilterBar";
import { ImageGrid, type ImageItem } from "@/app/components/dashboard/images/ImageGrid";
import { ImageViewModeToggle, type ImageViewMode } from "@/app/components/dashboard/images/ImageViewModeToggle";
import { BulkActionBar } from "@/app/components/dashboard/images/BulkActionBar";
import { GenerateCollectionButton } from "@/app/components/dashboard/collections/GenerateCollectionButton";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { fetchPhotosPage, reorderPhotos, type Photo } from "@/app/lib/photos";
import { fetchPhotoCollectionCounts } from "@/app/lib/collections";
import { fetchBatchPhotoTags, fetchTags, type Tag } from "@/app/lib/tags";
import { ImageGridSkeleton } from "@/app/components/dashboard/images/ImageCardSkeleton";

const PHOTOS_PAGE_SIZE = 80;

export default function DashboardPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>("all");
  const [tags, setTags] = useState<Tag[]>([]);
  const [viewMode, setViewMode] = useState<ImageViewMode>("cards");
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const mapPhotosToImageItems = useCallback(
    async (token: string, photos: Photo[]): Promise<ImageItem[]> => {
      const photoIds = photos.map((p) => p.id);
      let collectionCountByPhotoId: Record<string, number> = {};

      if (photoIds.length > 0) {
        try {
          collectionCountByPhotoId = await fetchPhotoCollectionCounts(token, photoIds);
        } catch (err) {
          console.error("Failed to load collection counts:", err);
        }
      }

      const items: ImageItem[] = photos.map((p) => ({
        id: String(p.id),
        url: p.url,
        label: p.title || `Photo ${p.id}`,
        hasCollection: (collectionCountByPhotoId[String(p.id)] ?? 0) > 0,
        collectionCount: collectionCountByPhotoId[String(p.id)] ?? 0,
      }));

      if (photoIds.length > 0) {
        try {
          const tagMap = await fetchBatchPhotoTags(token, photoIds);
          for (const item of items) {
            const photoTags = tagMap[item.id];
            if (photoTags && photoTags.length > 0) {
              item.tags = photoTags.map((t) => ({ name: t.name, color_hex: t.color_hex }));
            }
          }
        } catch (err) {
          console.error("Failed to load tags:", err);
        }
      }

      return items;
    },
    []
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const loadPhotos = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [photoPage, userTags] = await Promise.all([
        fetchPhotosPage(token, { limit: PHOTOS_PAGE_SIZE, offset: 0 }),
        fetchTags(token),
      ]);

      setTags(userTags);

      const items = await mapPhotosToImageItems(token, photoPage.photos ?? []);

      setImages(items);
      setHasMorePhotos(Boolean(photoPage.has_more));
      setNextOffset(typeof photoPage.next_offset === "number" ? photoPage.next_offset : null);
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setLoading(false);
    }
  }, [mapPhotosToImageItems]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleReorder = useCallback(
    (reordered: ImageItem[]) => {
      setImages(reordered);

      const token = localStorage.getItem("access_token");
      if (!token) return;

      const updates = reordered.map((img, index) => ({
        id: Number(img.id),
        order_id: index,
      }));

      reorderPhotos(token, updates).catch((err) =>
        console.error("Failed to save order:", err)
      );
    },
    []
  );

  const handleDelete = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const handleBulkDelete = useCallback((ids: string[]) => {
    setImages((prev) => prev.filter((img) => !ids.includes(img.id)));
  }, []);

  const loadMorePhotos = useCallback(async () => {
    if (isLoadingMore || !hasMorePhotos || nextOffset === null) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsLoadingMore(true);
    try {
      const photoPage = await fetchPhotosPage(token, {
        limit: PHOTOS_PAGE_SIZE,
        offset: nextOffset,
      });

      const nextItems = await mapPhotosToImageItems(token, photoPage.photos ?? []);

      setImages((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const deduped = nextItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...deduped];
      });

      setHasMorePhotos(Boolean(photoPage.has_more));
      setNextOffset(typeof photoPage.next_offset === "number" ? photoPage.next_offset : null);
    } catch (err) {
      console.error("Failed to load more photos:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMorePhotos, isLoadingMore, mapPhotosToImageItems, nextOffset]);

  const filteredImages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const searchTerms = query ? query.split(/\s+/).filter(Boolean) : [];
    return images.filter((img) => {
      const matchesSearch = searchTerms.length === 0 || searchTerms.every((term) => {
        const matchesTitle = img.label?.toLowerCase().includes(term);
        const matchesTag = img.tags?.some((t) => t.name.toLowerCase().includes(term));
        return matchesTitle || matchesTag;
      });
      const matchesTagFilter = selectedTags.length === 0 || selectedTags.every((st) => img.tags?.some((t) => t.name === st));
      const matchesCollectionFilter =
        collectionFilter === "all" ||
        (collectionFilter === "in-collections" && img.hasCollection) ||
        (collectionFilter === "not-in-collection" && !img.hasCollection);
      return matchesSearch && matchesTagFilter && matchesCollectionFilter;
    });
  }, [images, searchQuery, selectedTags, collectionFilter]);

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <PageHeader
            title="All Images"
            description="Browse and organize your design inspiration"
          />
          <UploadButton onUploadSuccess={loadPhotos} />
        </div>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          tags={tags}
          collectionFilter={collectionFilter}
          onCollectionFilterChange={setCollectionFilter}
          trailingControl={<ImageViewModeToggle mode={viewMode} onChange={setViewMode} />}
        />
      </div>

      <div className="px-8">
        {loading ? (
          <ImageGridSkeleton />
        ) : images.length === 0 ? (
          <EmptyState
            title="No photos yet"
            description="Upload your first image to start building your library."
            action={(
              <UploadButton onUploadSuccess={loadPhotos} />
            )}
          />
        ) : filteredImages.length === 0 ? (
          <EmptyState
            title="No matching images"
            description="Try a different search term or adjust your filters."
          />
        ) : (
          <ImageGrid
            images={filteredImages}
            viewMode={viewMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onReorder={handleReorder}
            onDelete={handleDelete}
            hasMoreFromServer={hasMorePhotos}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMorePhotos}
          />
        )}
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteDone={handleBulkDelete}
      />

      <GenerateCollectionButton />
    </div>
  );
}