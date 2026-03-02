"use client";

import { useState, useEffect, useCallback } from "react";
import { CollectionHeader } from "@/app/components/dashboard/CollectionHeader";
import { CollectionImageSearchBar } from "@/app/components/dashboard/CollectionImageSearchBar";
import { ImageGrid, type ImageItem } from "@/app/components/dashboard/ImageGrid";
import { UploadImageModal } from "@/app/components/upload/UploadImageModal";
import { AddPhotoAlternateOutlined } from "@mui/icons-material";
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

  const numericId = Number(collectionId);

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

        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <CollectionImageSearchBar />
          </div>
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
            onReorder={setImages}
            onDelete={handleDelete}
          />
        )}
      </div>

      <UploadImageModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        collectionId={numericId}
      />
    </article>
  );
}
