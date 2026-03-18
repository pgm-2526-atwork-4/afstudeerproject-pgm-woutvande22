"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/app/components/dashboard/layout/PageHeader";
import { CollectionSearchBar } from "@/app/components/dashboard/collections/CollectionSearchBar";
import { CollectionGrid } from "@/app/components/dashboard/collections/CollectionGrid";
import { CollectionListItem } from "@/app/components/dashboard/collections/CollectionListItem";
import { GenerateCollectionButton } from "@/app/components/dashboard/collections/GenerateCollectionButton";
import { CreateCollectionModal } from "@/app/components/dashboard/collections/CreateCollectionModal";
import {
  fetchCollections,
  togglePinCollection,
  type Collection,
} from "@/app/lib/collections";
import { CollectionGridSkeleton } from "@/app/components/dashboard/collections/CollectionCardSkeleton";
import { COLLECTIONS_CHANGED } from "@/app/lib/events";
import { GridViewOutlined, ViewListOutlined } from "@mui/icons-material";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<
    { id: string; title: string; description: string; imageCount: number; color: string; pinned: boolean; coverImageUrl: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
          pinned: c.pinned ?? false,
          coverImageUrl: c.cover_image_url ?? null,
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

  useEffect(() => {
    const handleCollectionsChanged = () => {
      loadCollections();
    };

    window.addEventListener(COLLECTIONS_CHANGED, handleCollectionsChanged);
    return () => window.removeEventListener(COLLECTIONS_CHANGED, handleCollectionsChanged);
  }, [loadCollections]);

  const handleCreated = (collection: Collection) => {
    setCollections((prev) => [
      {
        id: String(collection.id),
        title: collection.title,
        description: "",
        imageCount: collection.image_count,
        color: "#4a86b5",
        pinned: collection.pinned ?? false,
        coverImageUrl: collection.cover_image_url ?? null,
      },
      ...prev,
    ]);
  };

  const handleTogglePin = async (id: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const updated = await togglePinCollection(token, Number(id));
      setCollections((prev) => {
        const newList = prev.map((c) =>
          c.id === id ? { ...c, pinned: updated.pinned } : c
        );
        // Sort: pinned first, then preserve order
        return newList.sort((a, b) => Number(b.pinned) - Number(a.pinned));
      });
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const filteredCollections = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return collections;
    return collections.filter((c) => c.title.toLowerCase().includes(query));
  }, [collections, searchQuery]);

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

        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1">
            <CollectionSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-sky-400 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Card view"
            >
              <GridViewOutlined fontSize="small" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-sky-400 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="List view"
            >
              <ViewListOutlined fontSize="small" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8">
        {loading ? (
          <CollectionGridSkeleton />
        ) : collections.length === 0 ? (
          <p className="text-sm text-gray-400 mt-10 text-center">
            No collections yet. Create your first one!
          </p>
        ) : filteredCollections.length === 0 ? (
          <p className="text-sm text-gray-400 mt-10 text-center">
            No collections match your search.
          </p>
        ) : viewMode === "grid" ? (
          <CollectionGrid collections={filteredCollections} onTogglePin={handleTogglePin} />
        ) : (
          <div className="flex flex-col gap-2 mt-6">
            {filteredCollections.map((collection) => (
              <CollectionListItem
                key={collection.id}
                {...collection}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
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
