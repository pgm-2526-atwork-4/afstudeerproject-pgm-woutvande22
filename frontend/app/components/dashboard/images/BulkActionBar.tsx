"use client";

import { useState } from "react";
import {
  DeleteOutline,
  CreateNewFolderOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { AddToCollectionModal } from "@/app/components/dashboard/collections/AddToCollectionModal";
import { Modal } from "@/app/components/ui/Modal";
import { deletePhoto } from "@/app/lib/photos";
import { removePhotoFromCollection } from "@/app/lib/collections";
import { dispatchSidebarCountsChanged } from "@/app/lib/events";

interface BulkActionBarProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onDeleteDone: (ids: string[]) => void;
  collectionId?: string;
  onAddToCollectionDone?: () => void;
}

export const BulkActionBar = ({
  selectedIds,
  onClearSelection,
  onDeleteDone,
  collectionId,
  onAddToCollectionDone,
}: BulkActionBarProps) => {
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const count = selectedIds.size;
  if (count === 0) return null;

  const handleAddToCollection = async (targetCollectionId: number) => {
    setIsAdding(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not authenticated");

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const ids = Array.from(selectedIds);

      // Add each photo to the collection
      await Promise.allSettled(
        ids.map((photoId) =>
          fetch(
            `${API_URL}/api/collections/${targetCollectionId}/photos?access_token=${encodeURIComponent(token)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photo_id: Number(photoId) }),
            }
          )
        )
      );

      setShowCollectionModal(false);
      dispatchSidebarCountsChanged();
      onClearSelection();
      onAddToCollectionDone?.();
    } catch (err) {
      console.error("Failed to add photos to collection:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not authenticated");

      const ids = Array.from(selectedIds);

      if (collectionId) {
        // Remove from this collection only
        await Promise.allSettled(
          ids.map((photoId) =>
            removePhotoFromCollection(token, Number(collectionId), Number(photoId))
          )
        );
      } else {
        // Permanently delete
        await Promise.allSettled(
          ids.map((photoId) => deletePhoto(token, Number(photoId)))
        );
      }

      dispatchSidebarCountsChanged();
      onDeleteDone(ids);
      onClearSelection();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error("Failed to bulk delete:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isCollectionRemove = !!collectionId;

  return (
    <>
      <div className="fixed bottom-6 left-[var(--sidebar-w)] right-0 z-50 flex justify-center pointer-events-none">
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl pointer-events-auto">
        <span className="text-sm font-medium whitespace-nowrap">
          {count} selected
        </span>

        <div className="w-px h-5 bg-gray-600" />

        {!collectionId && (
          <button
            type="button"
            onClick={() => setShowCollectionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            disabled={isAdding}
          >
            <CreateNewFolderOutlined sx={{ fontSize: 18 }} />
            Add to Collection
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
        >
          <DeleteOutline sx={{ fontSize: 18 }} />
          {collectionId ? "Remove from Collection" : "Delete"}
        </button>

        <div className="w-px h-5 bg-gray-600" />

        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          aria-label="Clear selection"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
        </div>
      </div>

      <AddToCollectionModal
        open={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        onConfirm={handleAddToCollection}
        isAdding={isAdding}
        count={count}
      />

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={isCollectionRemove ? "Remove Images" : "Delete Images"}
      >
        <div className="space-y-4">
          <div className={`flex items-start gap-3 p-3 border rounded-lg ${
            isCollectionRemove
              ? "bg-blue-50 border-blue-200"
              : "bg-amber-50 border-amber-200"
          }`}>
            <svg className={`w-5 h-5 shrink-0 mt-0.5 ${
              isCollectionRemove ? "text-blue-600" : "text-amber-600"
            }`} fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className={`text-sm ${
              isCollectionRemove ? "text-blue-800" : "text-amber-800"
            }`}>
              {isCollectionRemove
                ? <>This will remove <strong>{count}</strong> {count === 1 ? "image" : "images"} from this collection. The {count === 1 ? "image" : "images"} will not be deleted.</>
                : <>This will permanently delete <strong>{count}</strong> {count === 1 ? "image" : "images"} from <strong>every collection</strong> they belong to. This action cannot be undone.</>}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting
                ? (isCollectionRemove ? "Removing…" : "Deleting…")
                : (isCollectionRemove ? `Remove ${count} ${count === 1 ? "Image" : "Images"}` : `Delete ${count} ${count === 1 ? "Image" : "Images"}`)}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
