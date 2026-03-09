"use client";

import {
  DeleteOutlined,
  FlipToFrontOutlined,
  FlipToBackOutlined,
  ImageOutlined,
} from "@mui/icons-material";
import { MoodboardItemData } from "./MoodboardItem";
import { Tag } from "@/app/lib/tags";

interface MoodboardToolbarProps {
  selectedItem: MoodboardItemData | null;
  tags: Tag[];
  onMove: (id: string, x: number, y: number) => void;
  onScale: (id: string, scale: number) => void;
  onRemove: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
}

export function MoodboardToolbar({
  selectedItem,
  tags,
  onMove,
  onScale,
  onRemove,
  onBringForward,
  onSendBackward,
}: MoodboardToolbarProps) {
  return (
    <aside className="w-64 border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      {!selectedItem ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-gray-400 text-center">
            Select an item on the canvas to see its properties
          </p>
        </div>
      ) : (
        <>
          {/* ─── Item Info ─── */}
          <section className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <ImageOutlined sx={{ fontSize: 16 }} className="text-gray-400" />
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Image
              </h2>
            </div>

            {selectedItem.label && (
              <p className="text-sm text-gray-900 font-medium truncate" title={selectedItem.label}>
                {selectedItem.label}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      backgroundColor: `${tag.color_hex}20`,
                      color: tag.color_hex,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color_hex }}
                    />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {tags.length === 0 && (
              <p className="text-[10px] text-gray-400 mt-2">No tags</p>
            )}
          </section>

          {/* ─── Position ─── */}
          <section className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Position
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">X</span>
                <input
                  type="number"
                  value={Math.round(selectedItem.x)}
                  onChange={(e) => {
                    const x = Number(e.target.value) || 0;
                    onMove(selectedItem.id, x, selectedItem.y);
                  }}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 tabular-nums"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Y</span>
                <input
                  type="number"
                  value={Math.round(selectedItem.y)}
                  onChange={(e) => {
                    const y = Number(e.target.value) || 0;
                    onMove(selectedItem.id, selectedItem.x, y);
                  }}
                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 tabular-nums"
                />
              </label>
            </div>
          </section>

          {/* ─── Scale ─── */}
          <section className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Scale
            </h3>
            <label className="flex items-center gap-2">
              <input
                type="number"
                value={Math.round(selectedItem.scale * 100)}
                onChange={(e) => {
                  const pct = Number(e.target.value) || 20;
                  onScale(selectedItem.id, Math.max(0.2, pct / 100));
                }}
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 tabular-nums"
                min={20}
                step={5}
              />
              <span className="text-xs text-gray-400 shrink-0">%</span>
            </label>
          </section>

          {/* ─── Layer Order ─── */}
          <section className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Layer
            </h3>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onBringForward?.(selectedItem.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
              >
                <FlipToFrontOutlined sx={{ fontSize: 14 }} />
                Bring forward
              </button>
              <button
                type="button"
                onClick={() => onSendBackward?.(selectedItem.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
              >
                <FlipToBackOutlined sx={{ fontSize: 14 }} />
                Send backward
              </button>
            </div>
          </section>

          {/* ─── Remove ─── */}
          <section className="px-4 py-3 mt-auto">
            <button
              type="button"
              onClick={() => onRemove(selectedItem.id)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
            >
              <DeleteOutlined sx={{ fontSize: 14 }} />
              Remove from moodboard
            </button>
          </section>
        </>
      )}
    </aside>
  );
}
