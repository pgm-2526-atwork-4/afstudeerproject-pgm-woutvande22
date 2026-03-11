"use client";

export const ImageCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-4/3 bg-gray-200" />
    <div className="p-2 space-y-2">
      <div className="h-3 w-2/3 bg-gray-200 rounded" />
      <div className="flex gap-1">
        <div className="h-4 w-12 bg-gray-200 rounded-full" />
        <div className="h-4 w-10 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

export const ImageGridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-6">
    {Array.from({ length: count }).map((_, i) => (
      <ImageCardSkeleton key={i} />
    ))}
  </div>
);
