"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { MoodboardHeader } from "@/app/components/moodboard/MoodboardHeader";
import { MoodboardCanvas } from "@/app/components/moodboard/MoodboardCanvas";
import { MoodboardToolbar } from "@/app/components/moodboard/MoodboardToolbar";
import { MoodboardItemData } from "@/app/components/moodboard/MoodboardItem";

const collections: Record<string, { title: string; color: string }> = {
  "brand-assets-2024": { title: "Brand Assets 2024", color: "#4a86b5" },
  "ui-inspiration": { title: "UI Inspiration", color: "#c5dff0" },
  "typography-studies": { title: "Typography Studies", color: "#1e3a30" },
  "color-palettes": { title: "Color Palettes", color: "#c9a96e" },
  "product-photography": { title: "Product Photography", color: "#8b7355" },
  "illustrations": { title: "Illustrations", color: "#1e3a30" },
};

const collectionMoodboardImages: Record<string, MoodboardItemData[]> = {
  "brand-assets-2024": [
    { id: "img-1", label: "Image 1", color: "#9b7dd4", x: 120, y: 100, scale: 1.2 },
    { id: "img-2", label: "Image 2", color: "#e84393", x: 360, y: 60, scale: 1.3 },
    { id: "img-3", label: "Image 3", color: "#00b894", x: 620, y: 100, scale: 1.1 },
    { id: "img-4", label: "Image 4", color: "#f39c12", x: 100, y: 320, scale: 1.3 },
    { id: "img-5", label: "Image 5", color: "#3498db", x: 380, y: 340, scale: 1.2 },
  ],
};

export default function MoodboardPage() {
  const params = useParams<{ id: string }>();
  const collectionId = params.id;
  const collection = collections[collectionId];

  const [items, setItems] = useState<MoodboardItemData[]>(
    collectionMoodboardImages[collectionId] ?? []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [bgColor, setBgColor] = useState("#ffffff");

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

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Collection not found.</p>
      </div>
    );
  }

  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  return (
    <>
      <MoodboardHeader
        title={collection.title}
        color={collection.color}
        collectionId={collectionId}
        zoom={zoom}
        bgColor={bgColor}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onBgColorChange={setBgColor}
        onExport={handleExport}
      />

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
        onScale={handleScale}
        onRemove={handleRemove}
      />
    </>
  );
}
