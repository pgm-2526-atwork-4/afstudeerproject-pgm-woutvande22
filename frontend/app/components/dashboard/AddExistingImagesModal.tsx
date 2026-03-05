"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { Button } from "@/app/components/ui/Button";
import Image from "next/image";
import { SearchOutlined, CheckCircleOutlined, CloseOutlined } from "@mui/icons-material";
import { fetchPhotos, type Photo } from "@/app/lib/photos";
import { addPhotoToCollection, fetchCollectionPhotos } from "@/app/lib/collections";
import { fetchBatchPhotoTags, fetchTags, type Tag } from "@/app/lib/tags";

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
  const [photoTags, setPhotoTags] = useState<Record<string, { name: string; color_hex: string }[]>>({});
  const [tags, setTags] = useState<Tag[]>([]);
  const [existingPhotoIds, setExistingPhotoIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    setSelectedIds(new Set());
    setSearchQuery("");
    setSelectedTags([]);
    setError("");

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const [photos, collectionPhotos, userTags] = await Promise.all([
          fetchPhotos(token),
          fetchCollectionPhotos(token, collectionId),
          fetchTags(token),
        ]);

        setAllPhotos(photos);
        setExistingPhotoIds(new Set(collectionPhotos.map((p) => p.id)));
        setTags(userTags);

        // Fetch tags for all photos
        if (photos.length > 0) {
          try {
            const photoIds = photos.map((p) => p.id);
            const tagMap = await fetchBatchPhotoTags(token, photoIds);
            const mapped: Record<string, { name: string; color_hex: string }[]> = {};
            for (const photo of photos) {
              const pt = tagMap[String(photo.id)];
              if (pt && pt.length > 0) {
                mapped[String(photo.id)] = pt.map((t) => ({ name: t.name, color_hex: t.color_hex }));
              }
            }
            setPhotoTags(mapped);
          } catch (err) {
            console.error("Failed to load photo tags:", err);
          }
        }
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
    return availablePhotos.filter((p) => {
      const tags = photoTags[String(p.id)] || [];
      const matchesTitle = !query || p.title?.toLowerCase().includes(query);
      const matchesTagSearch = !query || tags.some((t) => t.name.toLowerCase().includes(query));
      const matchesSearch = matchesTitle || matchesTagSearch;
      const matchesTagFilter =
        selectedTags.length === 0 ||
        selectedTags.every((st) => tags.some((t) => t.name === st));
      return matchesSearch && matchesTagFilter;
    });
  }, [availablePhotos, searchQuery, selectedTags, photoTags]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTagFilter = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
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
    <Modal open={open} onClose={onClose} title="Add Existing Images" size="xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          Select images from your library to add to this collection.
        </p>

        <div className="flex items-center gap-3">
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
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
        </div>

        {selectedTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
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

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading images…</p>
        ) : availablePhotos.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            All your images are already in this collection.
          </p>
        ) : filteredPhotos.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No images match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-3 max-h-[28rem] overflow-y-auto p-1">
            {filteredPhotos.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              const tags = photoTags[String(photo.id)] || [];
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
                    sizes="160px"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-sky-400/20 flex items-center justify-center">
                      <CheckCircleOutlined className="text-sky-500" sx={{ fontSize: 32 }} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-2 py-1.5">
                    {photo.title && (
                      <p className="text-xs text-white truncate">{photo.title}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {tags.slice(0, 2).map((t) => (
                          <span
                            key={t.name}
                            className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white/90"
                            style={{ backgroundColor: t.color_hex + "CC" }}
                          >
                            {t.name}
                          </span>
                        ))}
                        {tags.length > 2 && (
                          <span className="text-[9px] text-white/70">+{tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
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
