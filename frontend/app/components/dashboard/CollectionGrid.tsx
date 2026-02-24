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
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
    {collections.map((collection) => (
      <CollectionCard key={collection.id} {...collection} />
    ))}
  </div>
);
