"use client";

import { useState, useEffect, useCallback } from "react";
import { CollectionHeader } from "@/app/components/dashboard/CollectionHeader";
import { ImageGrid, type ImageItem } from "@/app/components/dashboard/ImageGrid";
import { BulkActionBar } from "@/app/components/dashboard/BulkActionBar";
import { UploadImageModal } from "@/app/components/upload/UploadImageModal";
import { AddPhotoAlternateOutlined, SearchOutlined } from "@mui/icons-material";
import {
  fetchCollection,
  fetchCollectionPhotos,
  type Collection,
} from "@/app/lib/collections";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const numericId = Number(collectionId);

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
      const [col, photos] = await Promise.all([
        fetchCollection(token, numericId),
        fetchCollectionPhotos(token, numericId),
      ]);

      setCollection(col);
      setImages(
        photos.map((p) => ({
          id: String(p.id),
          label: p.title ?? undefined,
          url: p.url,
          tags: [],
        }))
      );
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

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-400">Loading collection…</p>
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
              placeholder="Search images in this collection..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
            />
          </div>

          <select className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent cursor-pointer">
            <option>Tags</option>
          </select>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <AddPhotoAlternateOutlined sx={{ fontSize: 18 }} />
            Add Image
          </button>
        </div>
      </div>

      <div className="px-8">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AddPhotoAlternateOutlined
              sx={{ fontSize: 48 }}
              className="text-gray-300 mb-3"
            />
            <p className="text-sm text-gray-400 mb-4">
              This collection is empty. Upload your first image!
            </p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              + Upload Image
            </button>
          </div>
        ) : (
          <ImageGrid
            images={images}
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
    </article>
  );
}
