"use client";

import { SearchOutlined } from "@mui/icons-material";
import { TagFilterDropdown, SelectedTagChips } from "@/app/components/ui/TagFilterDropdown";

interface Tag {
  id: number;
  name: string;
  color_hex: string;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  tags: Tag[];
}

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  tags,
}: SearchFilterBarProps) => {
  const toggleTag = (name: string) => {
    onTagsChange(
      selectedTags.includes(name)
        ? selectedTags.filter((t) => t !== name)
        : [...selectedTags, name]
    );
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <SearchOutlined
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            sx={{ fontSize: 18 }}
          />
          <input
            type="text"
            placeholder="Search by title or tags (space-separated)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
          />
        </div>

        <TagFilterDropdown
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          tags={tags}
        />
      </div>

      <SelectedTagChips
        selectedTags={selectedTags}
        onRemove={toggleTag}
        tags={tags}
        className="mt-3"
      />
    </div>
  );
};