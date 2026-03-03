"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { UploadButton } from "@/app/components/dashboard/UploadButton";
import { SearchFilterBar } from "@/app/components/dashboard/SearchbarFilterBar";
import { ImageGrid, type ImageItem } from "@/app/components/dashboard/ImageGrid";
import { BulkActionBar } from "@/app/components/dashboard/BulkActionBar";
import { GenerateCollectionButton } from "@/app/components/dashboard/GenerateCollectionButton";
import { fetchPhotos, reorderPhotos } from "@/app/lib/photos";
import { fetchBatchPhotoTags, fetchTags, type Tag } from "@/app/lib/tags";

export default function DashboardPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);

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
      const [photos, userTags] = await Promise.all([
        fetchPhotos(token),
        fetchTags(token),
      ]);

      setTags(userTags);

      const items: ImageItem[] = photos.map((p) => ({
        id: String(p.id),
        url: p.url,
        label: p.title || `Photo ${p.id}`,
      }));

      // Fetch tags for all photos in one batch request
      if (photos.length > 0) {
        try {
          const photoIds = photos.map((p) => p.id);
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

      setImages(items);
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const filteredImages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return images.filter((img) => {
      const matchesTitle = !query || (img.label?.toLowerCase().includes(query));
      const matchesTagSearch = !query || img.tags?.some((t) => t.name.toLowerCase().includes(query));
      const matchesSearch = matchesTitle || matchesTagSearch;
      const matchesTagFilter = !selectedTag || img.tags?.some((t) => t.name === selectedTag);
      return matchesSearch && matchesTagFilter;
    });
  }, [images, searchQuery, selectedTag]);

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
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          tags={tags}
        />
      </div>

      <div className="px-8">
        {loading ? (
          <p className="text-gray-500 text-sm mt-8">Loading photos...</p>
        ) : images.length === 0 ? (
          <p className="text-gray-500 text-sm mt-8">No photos yet. Upload your first image!</p>
        ) : filteredImages.length === 0 ? (
          <p className="text-gray-500 text-sm mt-8">No images match your search.</p>
        ) : (
          <ImageGrid
            images={filteredImages}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onReorder={handleReorder}
            onDelete={handleDelete}
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