"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { fetchCollections, type Collection } from "@/app/lib/collections";

interface AddToCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (collectionId: number) => void;
  isAdding: boolean;
  count: number;
}

export const AddToCollectionModal = ({
  open,
  onClose,
  onConfirm,
  isAdding,
  count,
}: AddToCollectionModalProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const cols = await fetchCollections(token);
        setCollections(cols);
        setSelectedCollectionId(null);
      } catch (err) {
        console.error("Failed to load collections:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Add to Collection">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Add {count} selected {count === 1 ? "image" : "images"} to a collection.
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading collections…</p>
        ) : collections.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No collections yet. Create one first.
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {collections.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedCollectionId(col.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors cursor-pointer ${
                  selectedCollectionId === col.id
                    ? "bg-sky-50 border-2 border-sky-400 text-sky-700 font-medium"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-700"
                }`}
              >
                <span className="font-medium">{col.title}</span>
                <span className="text-gray-400 ml-2 text-xs">
                  {col.image_count} {col.image_count === 1 ? "image" : "images"}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            disabled={isAdding}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => selectedCollectionId && onConfirm(selectedCollectionId)}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-400 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            disabled={isAdding || !selectedCollectionId}
          >
            {isAdding ? "Adding…" : "Add to Collection"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
