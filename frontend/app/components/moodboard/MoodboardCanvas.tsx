"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { MoodboardItem, MoodboardItemData } from "./MoodboardItem";

const DEFAULT_BASE_SIZE = 150;
const CANVAS_PADDING = 100;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const EXPORT_MARGIN = 60;

export function getExportBounds(items: MoodboardItemData[]) {
  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return { x: 0, y: 0, width: MIN_WIDTH, height: MIN_HEIGHT };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of visible) {
    const w = (item.baseWidth ?? DEFAULT_BASE_SIZE) * item.scale;
    const h = (item.baseHeight ?? DEFAULT_BASE_SIZE) * item.scale;
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x + w);
    maxY = Math.max(maxY, item.y + h);
  }

  return {
    x: minX - EXPORT_MARGIN,
    y: minY - EXPORT_MARGIN,
    width: Math.ceil(maxX - minX + EXPORT_MARGIN * 2),
    height: Math.ceil(maxY - minY + EXPORT_MARGIN * 2),
  };
}

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
  const panStartRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const canvasSize = useMemo(() => getCanvasSize(items), [items]);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const handleCanvasClick = useCallback(
    (e: React.PointerEvent) => {
      // Middle mouse button (button 1) — start panning
      if (e.button === 1) {
        e.preventDefault();

        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          panX: panOffset.x,
          panY: panOffset.y,
        };

        const handlePointerMove = (ev: PointerEvent) => {
          if (!panStartRef.current) return;
          const dx = ev.clientX - panStartRef.current.startX;
          const dy = ev.clientY - panStartRef.current.startY;
          setPanOffset({
            x: panStartRef.current.panX + dx,
            y: panStartRef.current.panY + dy,
          });
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
    [onSelect, panOffset]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const newZoom = Math.min(2, Math.max(0.25, zoom + delta));
        const clampedZoom = Math.round(newZoom * 100) / 100;

        // Mouse position relative to the container
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Point on the canvas (in canvas-space) under the cursor
        const canvasX = (mouseX - panOffset.x) / zoom;
        const canvasY = (mouseY - panOffset.y) / zoom;

        // New pan so the same canvas point stays under the cursor
        setPanOffset({
          x: mouseX - canvasX * clampedZoom,
          y: mouseY - canvasY * clampedZoom,
        });

        onZoomChange(clampedZoom);
      }
    },
    [zoom, onZoomChange, panOffset]
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
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          width: canvasSize.width,
          height: canvasSize.height,
          position: "absolute",
          top: 0,
          left: 0,
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
