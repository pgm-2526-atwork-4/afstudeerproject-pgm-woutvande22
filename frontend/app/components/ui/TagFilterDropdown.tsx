"use client";

import { useRef, useState, useEffect } from "react";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";

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

interface TagSearchInputProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  tags: TagOption[];
  placeholder?: string;
}

export const TagSearchInput = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  tags,
  placeholder = "Search by title or tags...",
}: TagSearchInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " && searchQuery.trim()) {
      const trimmed = searchQuery.trimEnd();
      const lower = trimmed.toLowerCase();
      // Find the longest tag name that matches the end of the input (handles multi-word tags)
      const match = tags
        .filter((t) => !selectedTags.includes(t.name))
        .sort((a, b) => b.name.length - a.name.length)
        .find((t) => {
          const tagLower = t.name.toLowerCase();
          if (!lower.endsWith(tagLower)) return false;
          const before = trimmed.length - t.name.length;
          return before === 0 || trimmed[before - 1] === " ";
        });
      if (match) {
        e.preventDefault();
        onTagsChange([...selectedTags, match.name]);
        const remaining = trimmed.slice(0, trimmed.length - match.name.length).trimEnd();
        onSearchChange(remaining);
      }
    }
    if (e.key === "Backspace" && searchQuery === "" && selectedTags.length > 0) {
      onTagsChange(selectedTags.slice(0, -1));
    }
  };

  const removeTag = (name: string) => {
    onTagsChange(selectedTags.filter((t) => t !== name));
  };

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap flex-1 min-h-[42px] px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-sky-400 focus-within:border-transparent transition-shadow cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <SearchOutlined className="text-gray-400 shrink-0" sx={{ fontSize: 18 }} />
      {selectedTags.map((name) => {
        const tag = tags.find((t) => t.name === name);
        return (
          <span
            key={name}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white shrink-0"
            style={{ backgroundColor: tag?.color_hex ?? "#6B7280" }}
          >
            {name}
            <CloseOutlined
              sx={{ fontSize: 11 }}
              className="cursor-pointer opacity-80 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(name);
              }}
            />
          </span>
        );
      })}
      <input
        ref={inputRef}
        type="text"
        placeholder={selectedTags.length === 0 ? placeholder : ""}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-w-[80px] py-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
      />
    </div>
  );
};
