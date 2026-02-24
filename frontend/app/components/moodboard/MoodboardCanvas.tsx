"use client";

import React, { useCallback, useRef } from "react";
import { MoodboardItem, MoodboardItemData } from "./MoodboardItem";

interface MoodboardCanvasProps {
  items: MoodboardItemData[];
  selectedId: string | null;
  zoom: number;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onScale: (id: string, scale: number) => void;
  onZoomChange: (zoom: number) => void;
}

export function MoodboardCanvas({
  items,
  selectedId,
  zoom,
  onSelect,
  onMove,
  onScale,
  onZoomChange,
}: MoodboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.PointerEvent) => {
      if (e.target === containerRef.current || e.target === containerRef.current?.firstChild) {
        onSelect(null);
      }
    },
    [onSelect]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newZoom = Math.min(2, Math.max(0.25, zoom + delta));
        onZoomChange(Math.round(newZoom * 100) / 100);
      }
    },
    [zoom, onZoomChange]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-white relative"
      onPointerDown={handleCanvasClick}
      onWheel={handleWheel}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
          width: 1920,
          height: 1080,
          position: "relative",
          minWidth: "fit-content",
        }}
      >
        {items.map((item) => (
          <MoodboardItem
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            zoom={zoom}
            onSelect={onSelect}
            onMove={onMove}
            onScale={onScale}
          />
        ))}
      </div>
    </div>
  );
}
