"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { CollectionSearchBar } from "@/app/components/dashboard/CollectionSearchBar";
import { CollectionGrid } from "@/app/components/dashboard/CollectionGrid";
import { GenerateCollectionButton } from "@/app/components/dashboard/GenerateCollectionButton";
import { CreateCollectionModal } from "@/app/components/dashboard/CreateCollectionModal";
import {
  fetchCollections,
  type Collection,
} from "@/app/lib/collections";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<
    { id: string; title: string; description: string; imageCount: number; color: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadCollections = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const data = await fetchCollections(token);
      setCollections(
        data.map((c) => ({
          id: String(c.id),
          title: c.title,
          description: "",
          imageCount: c.image_count,
          color: "#4a86b5",
        }))
      );
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleCreated = (collection: Collection) => {
    setCollections((prev) => [
      {
        id: String(collection.id),
        title: collection.title,
        description: "",
        imageCount: collection.image_count,
        color: "#4a86b5",
      },
      ...prev,
    ]);
  };

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Your Collections"
            description="Manage and organize your image collections"
          />
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            + Create Collection
          </button>
        </div>

        <CollectionSearchBar />
      </div>

      <div className="px-8">
        {loading ? (
          <p className="text-sm text-gray-400 mt-10 text-center">
            Loading collections…
          </p>
        ) : collections.length === 0 ? (
          <p className="text-sm text-gray-400 mt-10 text-center">
            No collections yet. Create your first one!
          </p>
        ) : (
          <CollectionGrid collections={collections} onReorder={setCollections} />
        )}
      </div>

      <GenerateCollectionButton />

      <CreateCollectionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
