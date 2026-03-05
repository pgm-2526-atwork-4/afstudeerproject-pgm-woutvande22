"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import Image from "next/image";
import { SearchOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { fetchPhotos, type Photo } from "@/app/lib/photos";
import { addPhotoToCollection, fetchCollectionPhotos } from "@/app/lib/collections";

interface AddExistingImagesModalProps {
  open: boolean;
  onClose: () => void;
  collectionId: number;
  onSuccess: () => void;
}

export const AddExistingImagesModal = ({
  open,
  onClose,
  collectionId,
  onSuccess,
}: AddExistingImagesModalProps) => {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [existingPhotoIds, setExistingPhotoIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setSelectedIds(new Set());
    setSearchQuery("");
    setError("");

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const [photos, collectionPhotos] = await Promise.all([
          fetchPhotos(token),
          fetchCollectionPhotos(token, collectionId),
        ]);

        setAllPhotos(photos);
        setExistingPhotoIds(new Set(collectionPhotos.map((p) => p.id)));
      } catch (err) {
        console.error("Failed to load photos:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, collectionId]);

  const availablePhotos = useMemo(() => {
    return allPhotos.filter((p) => !existingPhotoIds.has(p.id));
  }, [allPhotos, existingPhotoIds]);

  const filteredPhotos = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return availablePhotos;
    return availablePhotos.filter(
      (p) => p.title?.toLowerCase().includes(query) || String(p.id).includes(query)
    );
  }, [availablePhotos, searchQuery]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setAdding(true);
    setError("");

    try {
      const promises = Array.from(selectedIds).map((photoId) =>
        addPhotoToCollection(token, collectionId, photoId)
      );
      const results = await Promise.allSettled(promises);
      const failures = results.filter((r) => r.status === "rejected");

      if (failures.length > 0) {
        setError(`Failed to add ${failures.length} image(s). Some may already be in the collection.`);
      }

      if (failures.length < selectedIds.size) {
        onSuccess();
        onClose();
      }
    } catch {
      setError("Failed to add images to collection");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Existing Images">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          Select images from your library to add to this collection.
        </p>

        <div className="relative">
          <SearchOutlined
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            sx={{ fontSize: 18 }}
          />
          <input
            type="text"
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
          />
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading images…</p>
        ) : availablePhotos.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            All your images are already in this collection.
          </p>
        ) : filteredPhotos.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No images match your search.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto p-1">
            {filteredPhotos.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => toggleSelect(photo.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group ${
                    isSelected
                      ? "border-sky-400 ring-2 ring-sky-200"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.title || `Photo ${photo.id}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-sky-400/20 flex items-center justify-center">
                      <CheckCircleOutlined className="text-sky-500" sx={{ fontSize: 28 }} />
                    </div>
                  )}
                  {photo.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-2 py-1">
                      <p className="text-[10px] text-white truncate">{photo.title}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={adding || selectedIds.size === 0}
          >
            {adding
              ? "Adding…"
              : `Add ${selectedIds.size || ""} Image${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
