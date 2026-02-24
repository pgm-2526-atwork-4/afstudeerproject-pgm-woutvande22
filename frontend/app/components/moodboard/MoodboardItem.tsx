"use client";

import React, { useCallback, useRef, useState } from "react";

export interface MoodboardItemData {
  id: string;
  type: "image" | "text";
  label: string;
  color: string;
  x: number;
  y: number;
  scale: number;
  baseWidth?: number;
  baseHeight?: number;
  /** Text-item–only fields */
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
}

const DEFAULT_BASE_SIZE = 150;

interface MoodboardItemProps {
  item: MoodboardItemData;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onScale: (id: string, scale: number) => void;
  onTextChange?: (id: string, text: string) => void;
}

export function MoodboardItem({
  item,
  isSelected,
  zoom,
  onSelect,
  onMove,
  onScale,
  onTextChange,
}: MoodboardItemProps) {
  const baseW = item.baseWidth ?? DEFAULT_BASE_SIZE;
  const baseH = item.baseHeight ?? DEFAULT_BASE_SIZE;
  const w = baseW * item.scale;
  const h = baseH * item.scale;

  const dragStartRef = useRef<{ startX: number; startY: number; itemX: number; itemY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; startScale: number; baseW: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(item.id);

      const target = e.target as HTMLElement;
      if (target.dataset.resize) return;

      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        itemX: item.x,
        itemY: item.y,
      };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!dragStartRef.current) return;
        const dx = (ev.clientX - dragStartRef.current.startX) / zoom;
        const dy = (ev.clientY - dragStartRef.current.startY) / zoom;
        onMove(item.id, dragStartRef.current.itemX + dx, dragStartRef.current.itemY + dy);
      };

      const handlePointerUp = () => {
        dragStartRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [item.id, item.x, item.y, zoom, onSelect, onMove]
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      onSelect(item.id);

      resizeStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startScale: item.scale,
        baseW,
      };

      const handlePointerMove = (ev: PointerEvent) => {
        if (!resizeStartRef.current) return;
        const dx = (ev.clientX - resizeStartRef.current.startX) / zoom;
        const scaleChange = dx / resizeStartRef.current.baseW;
        const newScale = Math.max(0.2, resizeStartRef.current.startScale + scaleChange);
        onScale(item.id, Math.round(newScale * 100) / 100);
      };

      const handlePointerUp = () => {
        resizeStartRef.current = null;
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [item.id, item.scale, baseW, zoom, onSelect, onScale]
  );

  const isText = item.type === "text";

  return (
    <div
      onPointerDown={editing ? undefined : handlePointerDown}
      onDoubleClick={
        isText
          ? (e) => {
              e.stopPropagation();
              setEditing(true);
              setTimeout(() => textRef.current?.focus(), 0);
            }
          : undefined
      }
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        width: w,
        height: isText ? "auto" : h,
        minHeight: isText ? 30 * item.scale : undefined,
        cursor: editing ? "text" : "grab",
        userSelect: editing ? "auto" : "none",
        touchAction: "none",
      }}
    >
      {isText ? (
        /* ─── Text item ─── */
        <div
          className="w-full h-full rounded flex items-start justify-start"
          style={{
            outline: isSelected ? "2px solid #38bdf8" : "none",
            outlineOffset: 2,
            padding: 4 * item.scale,
          }}
        >
          {editing ? (
            <textarea
              ref={textRef}
              defaultValue={item.text ?? ""}
              onBlur={(e) => {
                setEditing(false);
                onTextChange?.(item.id, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditing(false);
                  onTextChange?.(item.id, e.currentTarget.value);
                }
              }}
              className="w-full bg-transparent border-none outline-none resize-none"
              style={{
                fontSize: (item.fontSize ?? 16) * item.scale,
                fontFamily: item.fontFamily ?? "inherit",
                color: item.textColor ?? "#000000",
                lineHeight: 1.4,
              }}
            />
          ) : (
            <span
              className="whitespace-pre-wrap wrap-break-word select-none"
              style={{
                fontSize: (item.fontSize ?? 16) * item.scale,
                fontFamily: item.fontFamily ?? "inherit",
                color: item.textColor ?? "#000000",
                lineHeight: 1.4,
              }}
            >
              {item.text || "Double-click to edit"}
            </span>
          )}
        </div>
      ) : (
        /* ─── Image / color item ─── */
        <div
          className="w-full h-full rounded-lg flex items-center justify-center shadow-md"
          style={{
            backgroundColor: item.color,
            outline: isSelected ? "2px solid #38bdf8" : "none",
            outlineOffset: 2,
          }}
        >
          <span className="text-white text-sm font-medium drop-shadow-sm select-none">
            {item.label}
          </span>
        </div>
      )}

      {isSelected && !editing && (
        <div
          data-resize="true"
          onPointerDown={handleResizePointerDown}
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-sky-400 border-2 border-white rounded-sm shadow-sm"
          style={{ cursor: "nwse-resize", touchAction: "none" }}
        />
      )}
    </div>
  );
}
