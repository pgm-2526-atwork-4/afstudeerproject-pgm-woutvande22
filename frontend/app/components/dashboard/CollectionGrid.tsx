"use client";

import { CollectionCard } from "./CollectionCard";
import { SortableList } from "../dnd/SortableList";
import { SortableGridItem } from "../dnd/SortableGridItem";

interface CollectionItem {
  id: string;
  title: string;
  description: string;
  imageCount: number;
  color: string;
}

interface CollectionGridProps {
  collections: CollectionItem[];
  onReorder: (collections: CollectionItem[]) => void;
}

export const CollectionGrid = ({ collections, onReorder }: CollectionGridProps) => (
  <SortableList
    items={collections}
    onReorder={onReorder}
    strategy="grid"
    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-6"
    renderItem={(collection) => (
      <SortableGridItem key={collection.id} id={collection.id}>
        <CollectionCard {...collection} />
      </SortableGridItem>
    )}
  />
);
