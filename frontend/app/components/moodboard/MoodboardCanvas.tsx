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
}

export function MoodboardCanvas({
  items,
  selectedId,
  zoom,
  onSelect,
  onMove,
  onScale,
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

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-white relative"
      onPointerDown={handleCanvasClick}
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
