"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckOutlined } from "@mui/icons-material";
import { ImageCard } from "./ImageCard";
import { DeleteButton } from "./DeleteButton";
import { DeleteImageModal } from "./DeleteImageModal";
import { SortableList } from "../../dnd/SortableList";
import { SortableGridItem } from "../../dnd/SortableGridItem";
import { SortableItem } from "../../dnd/SortableItem";
import { LoadingCircle } from "@/app/components/ui/LoadingCircle";
import { deletePhoto } from "@/app/lib/photos";
import { removePhotoFromCollection } from "@/app/lib/collections";
import { dispatchSidebarCountsChanged } from "@/app/lib/events";
import { getReadableTextColor } from "@/app/lib/color";
import type { ImageViewMode } from "./ImageViewModeToggle";

const PAGE_SIZE = 40;

export interface ImageTag {
  name: string;
  color_hex: string;
}

export interface ImageItem {
  id: string;
  label?: string;
  url?: string;
  tags?: ImageTag[];
  hasCollection?: boolean;
  collectionCount?: number;
}

interface ImageGridProps {
  images: ImageItem[];
  collectionId?: string;
  viewMode?: ImageViewMode;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onReorder: (images: ImageItem[]) => void;
  onDelete?: (id: string) => void;
  hasMoreFromServer?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
}

interface GridImageTileProps {
  image: ImageItem;
  selected: boolean;
  href: string;
  collectionId?: string;
  onToggleSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const GridImageTile = ({
  image,
  selected,
  href,
  collectionId,
  onToggleSelect,
  onDelete,
}: GridImageTileProps) => {
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
        await removePhotoFromCollection(token, Number(collectionId), Number(image.id));
      } else {
        await deletePhoto(token, Number(image.id));
      }

      setShowDeleteModal(false);
      dispatchSidebarCountsChanged();
      onDelete?.(image.id);
    } catch (error) {
      console.error("Failed to delete photo:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <article>
        <Link
          href={href}
          className={`group relative block overflow-hidden rounded-2xl border bg-white ${
            selected ? "border-sky-300 ring-2 ring-sky-200" : "border-slate-200/80"
          }`}
        >
          {image.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={image.label || `Photo ${image.id}`}
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="h-36 w-full bg-slate-200" />
          )}

          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSelect(image.id);
              }}
              className={`absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-2xl border backdrop-blur-sm transition-all duration-200 cursor-pointer ${
                selected
                  ? "border-2 border-white bg-sky-400 text-white opacity-100 shadow-lg shadow-sky-400/30"
                  : "border border-black/70 bg-white/88 text-slate-600 opacity-0 group-hover:opacity-100"
              }`}
              aria-label={selected ? "Deselect image" : "Select image"}
            >
              {selected && <CheckOutlined sx={{ fontSize: 16 }} />}
            </button>
          )}

          <DeleteButton onClick={handleDeleteClick} />
        </Link>
      </article>

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

export const ImageGrid = ({
  images,
  collectionId,
  viewMode = "cards",
  selectedIds,
  onToggleSelect,
  onReorder,
  onDelete,
  hasMoreFromServer = false,
  isLoadingMore = false,
  onLoadMore,
}: ImageGridProps) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const effectiveVisibleCount = Math.min(visibleCount, images.length);

  const visibleImages = useMemo(
    () => images.slice(0, effectiveVisibleCount),
    [images, effectiveVisibleCount]
  );

  const hasMoreLocal = effectiveVisibleCount < images.length;
  const hasMore = hasMoreLocal || hasMoreFromServer;

  const loadMore = useCallback(() => {
    if (hasMoreLocal) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, images.length));
      return;
    }

    if (hasMoreFromServer && !isLoadingMore) {
      void onLoadMore?.();
    }
  }, [hasMoreLocal, images.length, hasMoreFromServer, isLoadingMore, onLoadMore]);

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  const handleReorder = useCallback(
    (reorderedVisible: ImageItem[]) => {
      const visibleIds = new Set(reorderedVisible.map((image) => image.id));
      const remaining = images.filter((image) => !visibleIds.has(image.id));
      onReorder([...reorderedVisible, ...remaining]);
    },
    [images, onReorder]
  );

  const hrefFor = (id: string) => (collectionId ? `/dashboard/${id}?collection=${collectionId}` : `/dashboard/${id}`);

  const loaderText = isLoadingMore || hasMoreFromServer
    ? "Loading more images..."
    : "Scroll to load more";

  const loader = hasMore ? (
    <div ref={sentinelRef} className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
      <LoadingCircle size="sm" label="Loading more images" />
      {loaderText}
    </div>
  ) : null;

  if (viewMode === "grid") {
    return (
      <>
        <SortableList
          items={visibleImages}
          onReorder={handleReorder}
          strategy="grid"
          className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5"
          renderItem={(image) => {
            const selected = selectedIds?.has(image.id) ?? false;

            return (
              <SortableGridItem key={image.id} id={image.id} className="mb-3 break-inside-avoid">
                <GridImageTile
                  image={image}
                  selected={selected}
                  href={hrefFor(image.id)}
                  collectionId={collectionId}
                  onToggleSelect={onToggleSelect}
                  onDelete={onDelete}
                />
              </SortableGridItem>
            );
          }}
        />
        {loader}
      </>
    );
  }

  if (viewMode === "list") {
    return (
      <>
        <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <SortableList
            items={visibleImages}
            onReorder={handleReorder}
            strategy="vertical"
            className="divide-y divide-gray-100"
            renderItem={(image) => {
              const selected = selectedIds?.has(image.id) ?? false;

              return (
                <SortableItem key={image.id} id={image.id}>
                  <Link
                    href={hrefFor(image.id)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      selected ? "bg-sky-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {onToggleSelect && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleSelect(image.id);
                        }}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? "border-sky-500 bg-sky-500 text-white"
                            : "border-gray-300 text-gray-400 hover:border-gray-400"
                        }`}
                        aria-label={selected ? "Deselect image" : "Select image"}
                      >
                        {selected && <CheckOutlined sx={{ fontSize: 16 }} />}
                      </button>
                    )}

                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {image.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.url}
                          alt={image.label || `Photo ${image.id}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{image.label || `Photo ${image.id}`}</p>
                      <p className="text-xs text-slate-500">
                        {image.tags?.length ? `${image.tags.length} tag${image.tags.length === 1 ? "" : "s"}` : "Untagged"}
                      </p>

                      {image.tags && image.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {image.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.name}
                              className="max-w-20 truncate rounded-full px-2 py-1 text-[10px] font-medium shadow-sm"
                              style={{
                                backgroundColor: tag.color_hex || "#6B7280",
                                color: getReadableTextColor(tag.color_hex || "#6B7280"),
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {image.tags.length > 3 && (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                              +{image.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {image.hasCollection && (
                      <p className="shrink-0 text-xs font-medium text-slate-500">
                        {image.collectionCount ?? 1} collection{(image.collectionCount ?? 1) === 1 ? "" : "s"}
                      </p>
                    )}
                  </Link>
                </SortableItem>
              );
            }}
          />
        </section>
        {loader}
      </>
    );
  }

  return (
    <>
      <SortableList
        items={visibleImages}
        onReorder={handleReorder}
        strategy="grid"
        className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(180px,180px))] justify-center gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,220px))] lg:grid-cols-[repeat(auto-fill,minmax(260px,260px))]"
        renderItem={(image) => (
          <SortableGridItem key={image.id} id={image.id}>
            <ImageCard
              id={image.id}
              label={image.label}
              url={image.url}
              tags={image.tags}
              collectionId={collectionId}
              hasCollection={image.hasCollection}
              collectionCount={image.collectionCount}
              selected={selectedIds?.has(image.id)}
              onSelect={onToggleSelect}
              onDelete={() => onDelete?.(image.id)}
            />
          </SortableGridItem>
        )}
      />
      {loader}
    </>
  );
};