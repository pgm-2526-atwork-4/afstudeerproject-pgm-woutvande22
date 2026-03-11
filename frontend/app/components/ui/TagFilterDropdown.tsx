"use client";

import { useRef, useState, useEffect } from "react";
import { CloseOutlined } from "@mui/icons-material";

interface TagOption {
  id: number;
  name: string;
  color_hex: string;
}

interface TagFilterDropdownProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  tags: TagOption[];
}

export const TagFilterDropdown = ({
  selectedTags,
  onTagsChange,
  tags,
}: TagFilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTag = (name: string) => {
    onTagsChange(
      selectedTags.includes(name)
        ? selectedTags.filter((t) => t !== name)
        : [...selectedTags, name]
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent cursor-pointer flex items-center gap-2 min-w-[120px]"
      >
        {selectedTags.length === 0
          ? "All tags"
          : `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}`}
        <svg
          className="w-4 h-4 ml-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => onTagsChange([])}
              className="w-full text-left px-3 py-2 text-xs text-sky-500 hover:bg-gray-50 border-b border-gray-100"
            >
              Clear all
            </button>
          )}
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.name)}
                onChange={() => toggleTag(tag.name)}
                className="rounded border-gray-300 text-sky-400 focus:ring-sky-400"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color_hex }}
              />
              {tag.name}
            </label>
          ))}
          {tags.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">No tags yet</p>
          )}
        </div>
      )}
    </div>
  );
};

interface SelectedTagChipsProps {
  selectedTags: string[];
  onRemove: (name: string) => void;
  tags: TagOption[];
  className?: string;
}

export const SelectedTagChips = ({
  selectedTags,
  onRemove,
  tags,
  className = "",
}: SelectedTagChipsProps) => {
  if (selectedTags.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {selectedTags.map((name) => {
        const tag = tags.find((t) => t.name === name);
        return (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag?.color_hex ?? "#6B7280" }}
          >
            {name}
            <CloseOutlined
              sx={{ fontSize: 12 }}
              className="cursor-pointer opacity-80 hover:opacity-100"
              onClick={() => onRemove(name)}
            />
          </span>
        );
      })}
    </div>
  );
};
