"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { CollectionHeader } from "@/app/components/dashboard/CollectionHeader";
import { ImageGrid, type ImageItem } from "@/app/components/dashboard/ImageGrid";
import { BulkActionBar } from "@/app/components/dashboard/BulkActionBar";
import { UploadImageModal } from "@/app/components/upload/UploadImageModal";
import { AddExistingImagesModal } from "@/app/components/dashboard/AddExistingImagesModal";
import { AddPhotoAlternateOutlined, SearchOutlined, CloseOutlined, CollectionsOutlined } from "@mui/icons-material";
import {
  fetchCollection,
  fetchCollectionPhotos,
  type Collection,
} from "@/app/lib/collections";
import { fetchBatchPhotoTags, fetchTags, type Tag } from "@/app/lib/tags";
import { ImageGridSkeleton } from "@/app/components/dashboard/ImageCardSkeleton";

interface CollectionDetailContentProps {
  collectionId: string;
}

export function CollectionDetailContent({
  collectionId,
}: CollectionDetailContentProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const numericId = Number(collectionId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTagFilter = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token || isNaN(numericId)) return;

    try {
      const [col, photos, userTags] = await Promise.all([
        fetchCollection(token, numericId),
        fetchCollectionPhotos(token, numericId),
        fetchTags(token),
      ]);

      setCollection(col);
      setTags(userTags);

      const items: ImageItem[] = photos.map((p) => ({
        id: String(p.id),
        label: p.title ?? undefined,
        url: p.url,
        tags: [],
      }));

      // Fetch tags for photos in this collection
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
          console.error("Failed to load photo tags:", err);
        }
      }

      setImages(items);
    } catch (err) {
      console.error("Failed to load collection:", err);
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleBulkDelete = (ids: string[]) => {
    setImages((prev) => prev.filter((img) => !ids.includes(img.id)));
  };

  const handleUploadSuccess = () => {
    loadData();
  };

  const filteredImages = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return images.filter((img) => {
      const matchesTitle = !query || (img.label?.toLowerCase().includes(query));
      const matchesTagSearch = !query || img.tags?.some((t) => t.name.toLowerCase().includes(query));
      const matchesSearch = matchesTitle || matchesTagSearch;
      const matchesTagFilter = selectedTags.length === 0 || selectedTags.every((st) => img.tags?.some((t) => t.name === st));
      return matchesSearch && matchesTagFilter;
    });
  }, [images, searchQuery, selectedTags]);

  if (loading) {
    return (
      <div className="px-8 pt-8">
        <ImageGridSkeleton />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Collection not found.</p>
      </div>
    );
  }

  return (
    <article className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-6 pb-4 bg-gray-50/80 backdrop-blur-md">
        <CollectionHeader
          title={collection.title}
          description=""
          imageCount={collection.image_count}
          color="#4a86b5"
          collectionId={collectionId}
        />

        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1">
            <SearchOutlined
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              sx={{ fontSize: 18 }}
            />
            <input
              type="text"
              placeholder="Search by title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
            />
          </div>

          <div className="relative" ref={tagDropdownRef}>
            <button
              type="button"
              onClick={() => setTagDropdownOpen((v) => !v)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent cursor-pointer flex items-center gap-2 min-w-[120px]"
            >
              {selectedTags.length === 0
                ? "All tags"
                : `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}`}
              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tagDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="w-full text-left px-3 py-2 text-xs text-sky-500 hover:bg-gray-50 border-b border-gray-100"
                  >
                    Clear all
                  </button>
                )}
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.name)}
                      onChange={() => toggleTagFilter(tag.name)}
                      className="rounded border-gray-300 text-sky-400 focus:ring-sky-400"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color_hex }}
                    />
                    {tag.name}
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-400">No tags yet</p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddExistingModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <CollectionsOutlined sx={{ fontSize: 18 }} />
            Add From Library
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <AddPhotoAlternateOutlined sx={{ fontSize: 18 }} />
            Upload Image
          </button>
        </div>

        {selectedTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {selectedTags.map((name) => {
              const tag = tags.find((t) => t.name === name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag?.color_hex ?? "#6B7280" }}
                >
                  {name}
                  <CloseOutlined
                    sx={{ fontSize: 12 }}
                    className="cursor-pointer opacity-80 hover:opacity-100"
                    onClick={() => toggleTagFilter(name)}
                  />
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-8">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AddPhotoAlternateOutlined
              sx={{ fontSize: 48 }}
              className="text-gray-300 mb-3"
            />
            <p className="text-sm text-gray-400 mb-4">
              Looks like this collection is empty. Add your first image to get started.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowAddExistingModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <CollectionsOutlined sx={{ fontSize: 18 }} />
                Add From Library
              </button>
              <p className="text-gray-400">or</p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <AddPhotoAlternateOutlined sx={{ fontSize: 18 }} />
                Upload Image
              </button>
            </div>
          </div>
        ) : filteredImages.length === 0 ? (
          <p className="text-gray-500 text-sm mt-8">No images match your search.</p>
        ) : (
          <ImageGrid
            images={filteredImages}
            collectionId={collectionId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onReorder={setImages}
            onDelete={handleDelete}
          />
        )}
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds(new Set())}
        onDeleteDone={handleBulkDelete}
        collectionId={collectionId}
      />

      <UploadImageModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        collectionId={numericId}
      />

      <AddExistingImagesModal
        open={showAddExistingModal}
        onClose={() => setShowAddExistingModal(false)}
        collectionId={numericId}
        onSuccess={loadData}
      />
    </article>
  );
}
