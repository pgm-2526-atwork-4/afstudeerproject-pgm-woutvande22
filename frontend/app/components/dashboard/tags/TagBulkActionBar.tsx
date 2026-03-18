"use client";

import { CloseOutlined, DeleteOutline } from "@mui/icons-material";

interface TagBulkActionBarProps {
  selectedCount: number;
  visibleCount: number;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: (checked: boolean) => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  disabled?: boolean;
}

export const TagBulkActionBar = ({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  onToggleSelectAllVisible,
  onClearSelection,
  onDeleteSelected,
  disabled = false,
}: TagBulkActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-(--sidebar-w) right-0 z-50 flex justify-center pointer-events-none">
      <div className="flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl pointer-events-auto">
        <span className="text-sm font-medium whitespace-nowrap">{selectedCount} selected</span>

        <div className="w-px h-5 bg-gray-600" />

        <label className="inline-flex items-center gap-2 text-sm text-gray-200">
          <input
            type="checkbox"
            checked={allVisibleSelected && visibleCount > 0}
            onChange={(event) => onToggleSelectAllVisible(event.target.checked)}
            disabled={visibleCount === 0 || disabled}
            className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-sky-400 focus:ring-sky-400 disabled:cursor-not-allowed"
          />
          Select All ({visibleCount})
        </label>

        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={selectedCount === 0 || disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DeleteOutline sx={{ fontSize: 18 }} />
          Delete selected
        </button>

        <div className="w-px h-5 bg-gray-600" />

        <button
          type="button"
          onClick={onClearSelection}
          disabled={selectedCount === 0 || disabled}
          className="p-1 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Clear selection"
        >
          <CloseOutlined sx={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
};
