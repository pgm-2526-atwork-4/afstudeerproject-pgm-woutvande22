"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { MoodboardHeader } from "@/app/components/moodboard/MoodboardHeader";
import { MoodboardCanvas } from "@/app/components/moodboard/MoodboardCanvas";
import { MoodboardToolbar } from "@/app/components/moodboard/MoodboardToolbar";
import { MoodboardItemData } from "@/app/components/moodboard/MoodboardItem";
import { fetchCollection, fetchCollectionPhotos } from "@/app/lib/collections";
import { fetchBatchPhotoTags, Tag } from "@/app/lib/tags";
import { fetchMoodboard, saveMoodboard, SaveMoodboardItem } from "@/app/lib/moodboard";

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

  // Track whether the initial load is done (to prevent auto-save on first render)
  const initialLoadDone = useRef(false);

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
        const [col, photos, moodboardData] = await Promise.all([
          fetchCollection(token, numericId),
          fetchCollectionPhotos(token, numericId),
          fetchMoodboard(token, numericId),
        ]);

        setCollectionTitle(col.title);

        // Build a photo lookup for URL and title
        const photoMap = new Map(
          photos.map((p) => [p.id, { url: p.url, title: p.title }])
        );

        // If saved moodboard items exist, restore them
        if (moodboardData.items.length > 0) {
          if (moodboardData.moodboard) {
            setBgColor(moodboardData.moodboard.background_color);
          }

          const restored: MoodboardItemData[] = moodboardData.items
            .filter((row) => row.photo_id && photoMap.has(row.photo_id))
            .map((row) => {
              const photo = photoMap.get(row.photo_id!)!;
              return {
                id: String(row.photo_id),
                type: (row.type === "photo" ? "image" : row.type) as "image" | "text",
                label: photo.title || `Image`,
                color: "#e2e8f0",
                imageUrl: photo.url,
                x: row.x_pos,
                y: row.y_pos,
                scale: row.scale,
                baseWidth: row.width,
                baseHeight: row.height,
                zIndex: row.z_index,
                borderRadius: row.border_radius,
                locked: row.locked,
                hidden: row.hidden,
              };
            });

          setItems(restored);
        } else {
          // No saved layout — generate default grid
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

          const COLS = 3;
          const GAP_X = 280;
          const GAP = 40;
          const START_X = 80;
          const START_Y = 60;

          const heights = imageSizes.map(({ w, h }) => {
            const aspect = h / (w || 1);
            return Math.round(BASE_WIDTH * aspect);
          });

          const rowTops: number[] = [START_Y];

          const moodboardItems: MoodboardItemData[] = photos.map(
            (photo, idx) => {
              const col = idx % COLS;
              const row = Math.floor(idx / COLS);
              const baseH = heights[idx];

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
        }

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
        // Mark load as done so auto-save can begin
        setTimeout(() => { initialLoadDone.current = true; }, 500);
      }
    };

    load();
  }, [collectionId]);

  // ─── Auto-save: debounce save whenever items or bgColor change ───
  useEffect(() => {
    if (!initialLoadDone.current) return;

    const token = localStorage.getItem("access_token");
    const numericId = Number(collectionId);
    if (!token || isNaN(numericId)) return;

    const timeout = setTimeout(() => {
      const itemRows: SaveMoodboardItem[] = items.map((item) => ({
        photo_id: item.type === "image" ? Number(item.id) : null,
        type: item.type === "image" ? "photo" : item.type,
        text_content: item.text ?? null,
        x_pos: item.x,
        y_pos: item.y,
        width: item.baseWidth ?? 240,
        height: item.baseHeight ?? 240,
        z_index: item.zIndex ?? 0,
        scale: item.scale,
        border_radius: item.borderRadius ?? 0,
        locked: item.locked ?? false,
        hidden: item.hidden ?? false,
      }));

      saveMoodboard(token, numericId, {
        background_color: bgColor,
        items: itemRows,
      }).catch((err) => console.error("Auto-save failed:", err));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [items, bgColor, collectionId]);

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

  const handleReorderLayers = useCallback((reordered: MoodboardItemData[]) => {
    setItems((prev) => {
      const zMap = new Map(reordered.map((item) => [item.id, item.zIndex]));
      return prev.map((item) => ({
        ...item,
        zIndex: zMap.get(item.id) ?? item.zIndex,
      }));
    });
  }, []);

  const handleUpdateItem = useCallback((id: string, updates: Partial<MoodboardItemData>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
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
          items={items}
          selectedItem={selectedItem}
          tags={selectedTags}
          onSelect={setSelectedId}
          onMove={handleMove}
          onScale={handleScale}
          onRemove={handleRemove}
          onUpdateItem={handleUpdateItem}
          onReorderLayers={handleReorderLayers}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
        />
      </div>
    </>
  );
}
