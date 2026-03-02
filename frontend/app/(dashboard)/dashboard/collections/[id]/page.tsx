"use client";

import { use } from "react";
import { CollectionDetailContent } from "./CollectionDetailContent";

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = use(params);

  return <CollectionDetailContent collectionId={id} />;
}
