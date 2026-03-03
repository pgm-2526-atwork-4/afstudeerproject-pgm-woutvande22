"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DeleteButton } from "@/app/components/dashboard/DeleteButton";
import { DeleteImageModal } from "@/app/components/dashboard/DeleteImageModal";
import { deletePhoto } from "@/app/lib/photos";
import { removePhotoFromCollection } from "@/app/lib/collections";

interface ImageTag {
  name: string;
  color_hex: string;
}

interface ImageCardProps {
  id: string;
  label?: string;
  url?: string;
  tags?: ImageTag[];
  collectionId?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: () => void;
}

export const ImageCard = ({ id, label, url, tags = [], collectionId, selected, onSelect, onDelete }: ImageCardProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Not authenticated");

      if (collectionId) {
        // Only remove from this collection, don't delete the photo itself
        await removePhotoFromCollection(token, Number(collectionId), Number(id));
      } else {
        // Permanently delete the photo
        await deletePhoto(token, Number(id));
      }

      setShowDeleteModal(false);
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete photo:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Link 
        href={collectionId ? `/dashboard/${id}?collection=${collectionId}` : `/dashboard/${id}`} 
        className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
      >
        <div className="aspect-4/3 relative bg-gray-100">
          {url ? (
            <Image
              src={url}
              alt={label || "Uploaded photo"}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}

          {/* Selection checkbox */}
          {onSelect && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(id); }}
              className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                selected
                  ? "bg-sky-400 border-sky-400 opacity-100"
                  : "bg-white/90 border-gray-300 opacity-0 group-hover:opacity-100"
              }`}
              aria-label={selected ? "Deselect image" : "Select image"}
            >
              {selected && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          <DeleteButton onClick={handleDeleteClick} />
        </div>
        <div className="p-2">
          {/* <p className="text-xs font-medium text-gray-900 truncate">{label || "Untitled"}</p> */}
          {tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.name}
                  className="px-1.5 py-0.5 text-[10px] rounded-full text-white truncate max-w-[80px]"
                  style={{ backgroundColor: tag.color_hex || "#6B7280" }}
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <DeleteImageModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        isCollectionRemove={!!collectionId}
      />
    </>
  );
};