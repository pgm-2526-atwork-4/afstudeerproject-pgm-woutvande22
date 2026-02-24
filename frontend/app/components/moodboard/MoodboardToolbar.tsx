"use client";

import { DeleteOutlined } from "@mui/icons-material";
import { MoodboardItemData } from "./MoodboardItem";

interface MoodboardToolbarProps {
  selectedItem: MoodboardItemData | null;
  onScale: (id: string, scale: number) => void;
  onRemove: (id: string) => void;
}

export function MoodboardToolbar({
  selectedItem,
  onScale,
  onRemove,
}: MoodboardToolbarProps) {
  if (!selectedItem) return null;

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
      </div>

      <button
        type="button"
        onClick={() => onRemove(selectedItem.id)}
        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors cursor-pointer"
      >
        <DeleteOutlined sx={{ fontSize: 16 }} />
        Remove
      </button>
    </footer>
  );
}
