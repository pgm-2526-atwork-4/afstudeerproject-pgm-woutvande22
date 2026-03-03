"use client";

import { CollectionCard } from "./CollectionCard";

interface CollectionItem {
  id: string;
  title: string;
  description: string;
  imageCount: number;
  color: string;
}

interface CollectionGridProps {
  collections: CollectionItem[];
}

export const CollectionGrid = ({ collections }: CollectionGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-6">
    {collections.map((collection) => (
      <CollectionCard key={collection.id} {...collection} />
    ))}
  </div>
);
