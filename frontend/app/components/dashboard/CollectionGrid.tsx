"use client";

import { CollectionCard } from "./CollectionCard";

interface CollectionItem {
  id: string;
  title: string;
  description: string;
  imageCount: number;
  color: string;
  pinned?: boolean;
}

interface CollectionGridProps {
  collections: CollectionItem[];
  onTogglePin?: (id: string) => void;
}

export const CollectionGrid = ({ collections, onTogglePin }: CollectionGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-6">
    {collections.map((collection) => (
      <CollectionCard
        key={collection.id}
        {...collection}
        onTogglePin={onTogglePin}
      />
    ))}
  </div>
);
