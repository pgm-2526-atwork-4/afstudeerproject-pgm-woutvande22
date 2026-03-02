"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CloseOutlined } from "@mui/icons-material";
import { fetchTags, type Tag } from "@/app/lib/tags";

interface SelectedTag {
  /** Set for existing tags; undefined for brand-new ones */
  id?: number;
  name: string;
  color_hex: string;
}

interface TagSelectorProps {
  selectedTags: SelectedTag[];
  onChange: (tags: SelectedTag[]) => void;
}

const DEFAULT_COLOR = "#6B7280";

export const TagSelector = ({ selectedTags, onChange }: TagSelectorProps) => {
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch user's existing tags once
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetchTags(token)
      .then(setExistingTags)
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedNames = useMemo(
    () => new Set(selectedTags.map((t) => t.name.toLowerCase())),
    [selectedTags]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return existingTags.filter(
      (t) => !selectedNames.has(t.name.toLowerCase()) &&
        (q === "" || t.name.toLowerCase().includes(q))
    );
  }, [existingTags, query, selectedNames]);

  const trimmedQuery = query.trim().toLowerCase();
  const canCreate =
    trimmedQuery.length > 0 &&
    !selectedNames.has(trimmedQuery) &&
    !existingTags.some((t) => t.name.toLowerCase() === trimmedQuery);

  const addTag = useCallback(
    (tag: SelectedTag) => {
      onChange([...selectedTags, tag]);
      setQuery("");
    },
    [selectedTags, onChange]
  );

  const removeTag = useCallback(
    (name: string) => {
      onChange(selectedTags.filter((t) => t.name !== name));
    },
    [selectedTags, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        // Select the first suggestion
        const tag = suggestions[0];
        addTag({ id: tag.id, name: tag.name, color_hex: tag.color_hex });
      } else if (canCreate) {
        addTag({ name: trimmedQuery, color_hex: DEFAULT_COLOR });
      }
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-gray-700">Tags</legend>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <li key={tag.name}>
              <span
                className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: tag.color_hex || DEFAULT_COLOR }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => removeTag(tag.name)}
                  className="hover:opacity-70 cursor-pointer"
                  aria-label={`Remove ${tag.name}`}
                >
                  <CloseOutlined sx={{ fontSize: 12 }} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Input + dropdown */}
      <div ref={wrapperRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or create tags…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
          aria-label="Tag search"
        />

        {open && (suggestions.length > 0 || canCreate) && (
          <ul className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {suggestions.map((tag) => (
              <li key={tag.id}>
                <button
                  type="button"
                  onClick={() => {
                    addTag({ id: tag.id, name: tag.name, color_hex: tag.color_hex });
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer"
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color_hex }}
                  />
                  {tag.name}
                </button>
              </li>
            ))}

            {canCreate && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    addTag({ name: trimmedQuery, color_hex: DEFAULT_COLOR });
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 cursor-pointer border-t border-gray-100"
                >
                  + Create &ldquo;{trimmedQuery}&rdquo;
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </fieldset>
  );
};

export type { SelectedTag };
