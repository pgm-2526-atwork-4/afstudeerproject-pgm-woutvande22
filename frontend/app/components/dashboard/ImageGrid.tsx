"use client";

import { ImageCard } from "./ImageCard";
import { SortableList } from "../dnd/SortableList";
import { SortableGridItem } from "../dnd/SortableGridItem";

export interface ImageTag {
  name: string;
  color_hex: string;
}

export interface ImageItem {
  id: string;
  label?: string;
  url?: string;
  tags?: ImageTag[];
}

interface ImageGridProps {
  images: ImageItem[];
  collectionId?: string;
  onReorder: (images: ImageItem[]) => void;
  onDelete?: (id: string) => void;
}

export const ImageGrid = ({ images, collectionId, onReorder, onDelete }: ImageGridProps) => (
  <SortableList
    items={images}
    onReorder={onReorder}
    strategy="grid"
    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-6"
    renderItem={(image) => (
      <SortableGridItem key={image.id} id={image.id}>
        <ImageCard
          id={image.id}
          label={image.label}
          url={image.url}
          tags={image.tags}
          collectionId={collectionId}
          onDelete={() => onDelete?.(image.id)}
        />
      </SortableGridItem>
    )}
  />
);