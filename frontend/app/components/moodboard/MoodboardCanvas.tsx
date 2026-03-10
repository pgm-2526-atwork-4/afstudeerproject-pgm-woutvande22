"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { MoodboardItem, MoodboardItemData } from "./MoodboardItem";

const DEFAULT_BASE_SIZE = 150;
const CANVAS_PADDING = 100;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;

export function getCanvasSize(items: MoodboardItemData[]) {
  if (items.length === 0) return { width: MIN_WIDTH, height: MIN_HEIGHT };

  let maxRight = 0;
  let maxBottom = 0;

  for (const item of items) {
    if (item.hidden) continue;
    const w = (item.baseWidth ?? DEFAULT_BASE_SIZE) * item.scale;
    const h = (item.baseHeight ?? DEFAULT_BASE_SIZE) * item.scale;
    maxRight = Math.max(maxRight, item.x + w);
    maxBottom = Math.max(maxBottom, item.y + h);
  }

  return {
    width: Math.max(MIN_WIDTH, Math.ceil(maxRight + CANVAS_PADDING)),
    height: Math.max(MIN_HEIGHT, Math.ceil(maxBottom + CANVAS_PADDING)),
  };
}

interface MoodboardCanvasProps {
  items: MoodboardItemData[];
  selectedId: string | null;
  zoom: number;
  bgColor: string;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onScale: (id: string, scale: number) => void;
  onZoomChange: (zoom: number) => void;
  onTextChange?: (id: string, text: string) => void;
  exportRef?: React.RefObject<HTMLDivElement | null>;
}

export function MoodboardCanvas({
  items,
  selectedId,
  zoom,
  bgColor,
  onSelect,
  onMove,
  onScale,
  onZoomChange,
  onTextChange,
  exportRef,
}: MoodboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const canvasSize = useMemo(() => getCanvasSize(items), [items]);

  const handleCanvasClick = useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse button (button 1) — start panning
      if (e.button === 1) {
        e.preventDefault();
        const el = containerRef.current;
        if (!el) return;

        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        };

        const handlePointerMove = (ev: PointerEvent) => {
          if (!panStartRef.current || !containerRef.current) return;
          const dx = ev.clientX - panStartRef.current.startX;
          const dy = ev.clientY - panStartRef.current.startY;
          containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
          containerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
        };

        const handlePointerUp = () => {
          panStartRef.current = null;
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return;
      }

      // Left click on empty canvas — deselect
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
      className="flex-1 overflow-hidden relative"
      style={{ backgroundColor: bgColor }}
      onPointerDown={handleCanvasClick}
      onWheel={handleWheel}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
    >
      <div
        ref={exportRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
          width: canvasSize.width,
          height: canvasSize.height,
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
            onTextChange={onTextChange}
          />
        ))}
      </div>
    </div>
  );
}
