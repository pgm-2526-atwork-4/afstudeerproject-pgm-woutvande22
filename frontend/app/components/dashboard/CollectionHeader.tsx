"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContentCopyOutlined, FavoriteBorderOutlined, GridViewOutlined, DeleteOutlined } from "@mui/icons-material";
import { Modal } from "@/app/components/ui/Modal";
import { deleteCollection } from "@/app/lib/collections";

interface CollectionHeaderProps {
  title: string;
  description: string;
  imageCount: number;
  color: string;
  collectionId?: string;
}

export const CollectionHeader = ({
  title,
  description,
  imageCount,
  color,
  collectionId,
}: CollectionHeaderProps) => {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!collectionId) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      await deleteCollection(token, Number(collectionId));
      router.push("/dashboard/collections");
    } catch (err) {
      console.error("Failed to delete collection:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Link
        href="/dashboard/collections"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        ← Back to Collections
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400 mt-1">{imageCount} Images</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <DeleteOutlined sx={{ fontSize: 18 }} />
            Delete
          </button>

          <Link
            href={collectionId ? `/moodboard/${collectionId}` : "#"}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <GridViewOutlined sx={{ fontSize: 18 }} />
            Create Moodboard
          </Link>
        </div>
      </div>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Collection"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-semibold">{title}</span>?
            The images inside will not be deleted.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete Collection"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
