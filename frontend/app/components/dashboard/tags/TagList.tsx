"use client";

import { useState, useRef, useEffect } from "react";
import type { Tag } from "@/app/lib/tags";

interface TagListProps {
  /** Tags currently attached to this photo */
  tags: Tag[];
  /** All user tags (for autocomplete suggestions) */
  allTags: Tag[];
  /** Whether add/remove operations are disabled */
  disabled?: boolean;
  onAdd: (tag: Tag) => void;
  onRemove: (tagId: number) => void;
  onCreate: (name: string) => void;
}

export const TagList = ({ tags, allTags, disabled, onAdd, onRemove, onCreate }: TagListProps) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const attachedIds = new Set(tags.map((t) => t.id));
  const trimmed = query.trim().toLowerCase();

  // Check if the typed tag is already attached to this image
  const isDuplicate = trimmed.length > 0 && tags.some((t) => t.name.toLowerCase() === trimmed);

  // Filter: tags not yet attached, matching the query
  const suggestions = allTags.filter(
    (t) => !attachedIds.has(t.id) && t.name.toLowerCase().includes(trimmed)
  );

  // Show "Create" option if query doesn't match any existing tag name exactly
  const exactMatch = allTags.some((t) => t.name.toLowerCase() === trimmed);
  const showCreate = trimmed.length > 0 && !exactMatch && !isDuplicate;

  const handleSelect = (tag: Tag) => {
    if (attachedIds.has(tag.id)) return;
    onAdd(tag);
    setQuery("");
    setOpen(false);
  };

  const handleCreate = () => {
    if (trimmed.length === 0) return;
    onCreate(trimmed);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isDuplicate) return;
      if (suggestions.length === 1) {
        handleSelect(suggestions[0]);
      } else if (showCreate && suggestions.length === 0) {
        handleCreate();
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-gray-700">Tags</h3>

      {/* Current tags */}
      <div className="flex gap-2 flex-wrap min-h-7">
        {tags.length === 0 && (
          <span className="text-xs text-gray-400 italic">No tags yet</span>
        )}
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 text-white text-xs rounded-full"
            style={{ backgroundColor: tag.color_hex || "#6B7280" }}
          >
            {tag.name}
            <button
              type="button"
              disabled={disabled}
              aria-label={`Remove ${tag.name} tag`}
              onClick={() => onRemove(tag.id)}
              className="ml-0.5 hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      {/* Add tag input with autocomplete */}
      <div ref={wrapperRef} className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add custom tag..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow disabled:opacity-50"
          />
  
        </div>

        {/* Duplicate warning */}
        {isDuplicate && (
          <p className="mt-1 text-xs text-amber-600">
            This tag is already added to this image.
          </p>
        )}

        {/* Dropdown */}
        {open && !isDuplicate && (suggestions.length > 0 || showCreate) && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color_hex || "#6B7280" }}
                />
                {tag.name}
              </button>
            ))}
            {showCreate && (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer border-t border-gray-100"
              >
                <span className="text-sky-400 font-bold">+</span>
                Create &ldquo;{trimmed}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
