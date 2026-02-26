"use client";

import { useState } from "react";
import { CollectionHeader } from "@/app/components/dashboard/CollectionHeader";
import { CollectionImageSearchBar } from "@/app/components/dashboard/CollectionImageSearchBar";
import { ImageGrid, type ImageItem } from "@/app/components/dashboard/ImageGrid";

interface CollectionDetailContentProps {
  collection: {
    title: string;
    description: string;
    imageCount: number;
    color: string;
  };
  images: ImageItem[];
  collectionId: string;
}

export function CollectionDetailContent({
  collection,
  images: initialImages,
  collectionId,
}: CollectionDetailContentProps) {
  const [images, setImages] = useState(initialImages);

  return (
    <article className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-6 pb-4 bg-gray-50/80 backdrop-blur-md">
        <CollectionHeader
          title={collection.title}
          description={collection.description}
          imageCount={collection.imageCount}
          color={collection.color}
          collectionId={collectionId}
        />

        <CollectionImageSearchBar />
      </div>

      <div className="px-8">
        <ImageGrid
          images={images}
          collectionId={collectionId}
          onReorder={setImages}
        />
      </div>
    </article>
  );
}
