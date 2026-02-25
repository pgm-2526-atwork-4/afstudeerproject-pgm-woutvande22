"use client";

import {
  DeleteOutlined,
  FlipToFrontOutlined,
  FlipToBackOutlined,
} from "@mui/icons-material";
import { MoodboardItemData } from "./MoodboardItem";

interface MoodboardToolbarProps {
  selectedItem: MoodboardItemData | null;
  onScale: (id: string, scale: number) => void;
  onRemove: (id: string) => void;
  onUpdateItem?: (id: string, updates: Partial<MoodboardItemData>) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
}

export function MoodboardToolbar({
  selectedItem,
  onScale,
  onRemove,
  onUpdateItem,
  onBringForward,
  onSendBackward,
}: MoodboardToolbarProps) {
  if (!selectedItem) return null;

  const isText = selectedItem.type === "text";

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Scale:
          <input
            type="number"
            value={Math.round(selectedItem.scale * 100)}
            onChange={(e) => {
              const pct = Number(e.target.value) || 20;
              onScale(selectedItem.id, Math.max(0.2, pct / 100));
            }}
            className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-gray-700 tabular-nums"
            min={20}
            step={5}
          />
          <span className="text-xs text-gray-400">%</span>
        </label>

        <span className="text-xs text-gray-400">
          X: {Math.round(selectedItem.x)}
        </span>
        <span className="text-xs text-gray-400">
          Y: {Math.round(selectedItem.y)}
        </span>

        {isText && (
          <>
            <div className="w-px h-4 bg-gray-200" />

            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              Size:
              <input
                type="number"
                value={selectedItem.fontSize ?? 16}
                onChange={(e) => {
                  const size = Math.max(8, Math.min(200, Number(e.target.value) || 16));
                  onUpdateItem?.(selectedItem.id, { fontSize: size });
                }}
                className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-gray-700 tabular-nums"
                min={8}
                max={200}
                step={1}
              />
              <span className="text-xs text-gray-400">px</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
              Color:
              <input
                type="color"
                value={selectedItem.textColor ?? "#000000"}
                onChange={(e) => {
                  onUpdateItem?.(selectedItem.id, { textColor: e.target.value });
                }}
                className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0 appearance-none [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded"
              />
            </label>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onBringForward?.(selectedItem.id)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          title="Bring Forward"
        >
          <FlipToFrontOutlined sx={{ fontSize: 16 }} />
          Forward
        </button>

        <button
          type="button"
          onClick={() => onSendBackward?.(selectedItem.id)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          title="Send Backward"
        >
          <FlipToBackOutlined sx={{ fontSize: 16 }} />
          Backward
        </button>

        <div className="w-px h-4 bg-gray-200" />

        <button
          type="button"
          onClick={() => onRemove(selectedItem.id)}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          <DeleteOutlined sx={{ fontSize: 16 }} />
          Remove
        </button>
      </div>
    </footer>
  );
}
