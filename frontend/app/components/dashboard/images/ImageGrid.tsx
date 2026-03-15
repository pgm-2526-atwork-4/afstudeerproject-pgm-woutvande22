"use client";

import { ImageCard } from "./ImageCard";
import { SortableList } from "../../dnd/SortableList";
import { SortableGridItem } from "../../dnd/SortableGridItem";

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
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onReorder: (images: ImageItem[]) => void;
  onDelete?: (id: string) => void;
}

export const ImageGrid = ({ images, collectionId, selectedIds, onToggleSelect, onReorder, onDelete }: ImageGridProps) => (
  <SortableList
    items={images}
    onReorder={onReorder}
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
);