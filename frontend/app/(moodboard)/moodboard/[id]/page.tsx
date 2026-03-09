"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { MoodboardHeader } from "@/app/components/moodboard/MoodboardHeader";
import { MoodboardCanvas } from "@/app/components/moodboard/MoodboardCanvas";
import { MoodboardToolbar } from "@/app/components/moodboard/MoodboardToolbar";
import { MoodboardItemData } from "@/app/components/moodboard/MoodboardItem";
import { fetchCollection, fetchCollectionPhotos } from "@/app/lib/collections";
import { fetchBatchPhotoTags, Tag } from "@/app/lib/tags";

export default function MoodboardPage() {
  const params = useParams<{ id: string }>();
  const collectionId = params.id;

  const [collectionTitle, setCollectionTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [items, setItems] = useState<MoodboardItemData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [bgColor, setBgColor] = useState("#EDEDED");
  const [photoTags, setPhotoTags] = useState<Record<string, Tag[]>>({});

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      const numericId = Number(collectionId);
      if (!token || isNaN(numericId)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const [col, photos] = await Promise.all([
          fetchCollection(token, numericId),
          fetchCollectionPhotos(token, numericId),
        ]);

        setCollectionTitle(col.title);

        // Load natural image dimensions
        const BASE_WIDTH = 240;
        const imageSizes = await Promise.all(
          photos.map(
            (photo) =>
              new Promise<{ w: number; h: number }>((resolve) => {
                const img = new Image();
                img.onload = () =>
                  resolve({ w: img.naturalWidth, h: img.naturalHeight });
                img.onerror = () => resolve({ w: BASE_WIDTH, h: BASE_WIDTH });
                img.src = photo.url;
              })
          )
        );

        // Lay out photos in a grid without overlapping
        const COLS = 3;
        const GAP_X = 280;
        const GAP = 40;
        const START_X = 80;
        const START_Y = 60;

        // Pre-compute base heights
        const heights = imageSizes.map(({ w, h }) => {
          const aspect = h / (w || 1);
          return Math.round(BASE_WIDTH * aspect);
        });

        // Track Y offset per row based on tallest image in previous rows
        const rowTops: number[] = [START_Y];

        const moodboardItems: MoodboardItemData[] = photos.map(
          (photo, idx) => {
            const col = idx % COLS;
            const row = Math.floor(idx / COLS);
            const baseH = heights[idx];

            // When starting a new row, compute its top from tallest in previous row
            if (row >= rowTops.length) {
              const prevRowStart = (row - 1) * COLS;
              const prevRowEnd = Math.min(prevRowStart + COLS, photos.length);
              const maxH = Math.max(
                ...heights.slice(prevRowStart, prevRowEnd)
              );
              rowTops.push(rowTops[row - 1] + maxH + GAP);
            }

            return {
              id: String(photo.id),
              type: "image" as const,
              label: photo.title || `Image ${idx + 1}`,
              color: "#e2e8f0",
              imageUrl: photo.url,
              x: START_X + col * GAP_X,
              y: rowTops[row],
              scale: 1,
              baseWidth: BASE_WIDTH,
              baseHeight: baseH,
              zIndex: idx,
            };
          }
        );

        setItems(moodboardItems);

        // Fetch tags for all photos
        const photoIds = photos.map((p) => p.id);
        if (photoIds.length > 0) {
          const tagsMap = await fetchBatchPhotoTags(token, photoIds);
          setPhotoTags(tagsMap);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [collectionId]);

  const handleMove = useCallback((id: string, x: number, y: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  }, []);

  const handleScale = useCallback((id: string, scale: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, scale } : item))
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedId(null);
  }, []);

  const handleBringForward = useCallback((id: string) => {
    setItems((prev) => {
      const maxZ = Math.max(...prev.map((i) => i.zIndex ?? 0));
      return prev.map((item) =>
        item.id === id ? { ...item, zIndex: maxZ + 1 } : item
      );
    });
  }, []);

  const handleSendBackward = useCallback((id: string) => {
    setItems((prev) => {
      const minZ = Math.min(...prev.map((i) => i.zIndex ?? 0));
      return prev.map((item) =>
        item.id === id ? { ...item, zIndex: minZ - 1 } : item
      );
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, 0.25));
  }, []);

  const handleExport = useCallback(() => {
    // TODO: implement export (e.g. html2canvas or server-side render)
    alert("Export coming soon!");
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading moodboard…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Collection not found.</p>
      </div>
    );
  }

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedTags = selectedItem
    ? photoTags[selectedItem.id] ?? []
    : [];

  return (
    <>
      <MoodboardHeader
        title={collectionTitle}
        color="#4a86b5"
        collectionId={collectionId}
        zoom={zoom}
        bgColor={bgColor}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onBgColorChange={setBgColor}
        onExport={handleExport}
      />

      <div className="flex flex-1 overflow-hidden">
        <MoodboardCanvas
          items={items}
          selectedId={selectedId}
          zoom={zoom}
          bgColor={bgColor}
          onSelect={setSelectedId}
          onMove={handleMove}
          onScale={handleScale}
          onZoomChange={setZoom}
        />

        <MoodboardToolbar
          selectedItem={selectedItem}
          tags={selectedTags}
          onMove={handleMove}
          onScale={handleScale}
          onRemove={handleRemove}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
        />
      </div>
    </>
  );
}
