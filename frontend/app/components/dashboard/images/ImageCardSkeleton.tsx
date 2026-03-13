"use client";

export const ImageCardSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.38)]">
    <div className="aspect-4/3 bg-linear-to-br from-slate-200 via-slate-100 to-sky-100" />
    <div className="space-y-3 p-3">
      <div className="h-4 w-3/4 rounded-full bg-slate-200" />
      <div className="h-3 w-16 rounded-full bg-slate-100" />
      <div className="flex gap-1.5">
        <div className="h-6 w-14 rounded-full bg-slate-200" />
        <div className="h-6 w-11 rounded-full bg-slate-100" />
      </div>
    </div>
  </div>
);

export const ImageGridSkeleton = ({ count = 12 }: { count?: number }) => (
  <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,240px))] justify-center gap-3 sm:grid-cols-[repeat(auto-fill,minmax(285px,285px))] lg:grid-cols-[repeat(auto-fill,minmax(330px,330px))]">
    {Array.from({ length: count }).map((_, i) => (
      <ImageCardSkeleton key={i} />
    ))}
  </div>
);
