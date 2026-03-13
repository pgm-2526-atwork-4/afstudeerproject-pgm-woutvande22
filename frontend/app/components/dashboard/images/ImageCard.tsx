"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FolderOutlined } from "@mui/icons-material";
import { DeleteButton } from "@/app/components/dashboard/images/DeleteButton";
import { DeleteImageModal } from "@/app/components/dashboard/images/DeleteImageModal";
import { deletePhoto } from "@/app/lib/photos";
import { removePhotoFromCollection } from "@/app/lib/collections";
import { dispatchSidebarCountsChanged } from "@/app/lib/events";

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
  hasCollection?: boolean;
  collectionCount?: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: () => void;
}

export const ImageCard = ({ id, label, url, tags = [], collectionId, hasCollection, collectionCount, selected, onSelect, onDelete }: ImageCardProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayLabel = label || "Untitled";

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
      dispatchSidebarCountsChanged();
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
        className={`group block overflow-hidden rounded-3xl border bg-white transition-all duration-300 ${
          selected
            ? "border-sky-300 shadow-[0_20px_40px_-24px_rgba(14,165,233,0.55)] ring-2 ring-sky-200/80"
            : "border-slate-200/80 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.38)] hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_48px_-24px_rgba(14,165,233,0.4)]"
        }`}
      >
        <article className="flex h-full flex-col">
        <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-slate-100 via-slate-50 to-sky-50">
          {url ? (
            <Image
              src={url}
              alt={displayLabel}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-slate-100 to-sky-100 text-sm font-medium text-slate-500">
              No preview
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/55 via-slate-950/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

          {onSelect && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(id); }}
              className={`absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer ${
                selected
                  ? "border-2 border-white bg-sky-400 text-white opacity-100 shadow-lg shadow-sky-400/30"
                  : "border border-black/70 bg-white/88 text-slate-600 opacity-0 group-hover:opacity-100"
              }`}
              aria-label={selected ? "Deselect image" : "Select image"}
            >
              {selected && (
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}

          <DeleteButton onClick={handleDeleteClick} />

          {hasCollection && (
            <div className="absolute right-3 bottom-3 flex min-w-9 items-center justify-center gap-1 rounded-2xl border border-white/15 bg-slate-950/55 px-2 text-white shadow-lg shadow-slate-950/20 backdrop-blur-sm h-9">
              <FolderOutlined sx={{ fontSize: 18 }} />
              <span className="text-xs font-semibold leading-none">{collectionCount ?? 1}</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900">{displayLabel}</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {tags.length > 0 ? `${tags.length} tag${tags.length === 1 ? "" : "s"}` : "Untagged"}
              </p>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.name}
                  className="max-w-20 truncate rounded-full px-2 py-1 text-[10px] font-medium text-white shadow-sm"
                  style={{ backgroundColor: tag.color_hex || "#6B7280" }}
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        </article>
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