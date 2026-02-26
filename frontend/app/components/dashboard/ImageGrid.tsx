"use client";

import { ImageCard } from "./ImageCard";
import { SortableList } from "../dnd/SortableList";
import { SortableGridItem } from "../dnd/SortableGridItem";

export interface ImageItem {
  id: string;
  label?: string;
  url?: string;
  tags?: string[];
}

interface ImageGridProps {
  images: ImageItem[];
  collectionId?: string;
  onReorder: (images: ImageItem[]) => void;
}

export const ImageGrid = ({ images, collectionId, onReorder }: ImageGridProps) => (
  <SortableList
    items={images}
    onReorder={onReorder}
    strategy="grid"
    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6"
    renderItem={(image) => (
      <SortableGridItem key={image.id} id={image.id}>
        <ImageCard
          id={image.id}
          label={image.label}
          url={image.url}
          tags={image.tags}
          collectionId={collectionId}
        />
      </SortableGridItem>
    )}
  />
);