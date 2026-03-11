"use client";

export const CollectionCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-[16/9] bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 w-1/2 bg-gray-200 rounded" />
      <div className="h-2.5 w-1/3 bg-gray-200 rounded" />
    </div>
  </div>
);

export const CollectionGridSkeleton = ({ count = 10 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-6">
    {Array.from({ length: count }).map((_, i) => (
      <CollectionCardSkeleton key={i} />
    ))}
  </div>
);
