"use client";

import { TagFilterDropdown, TagSearchInput } from "@/app/components/ui/TagFilterDropdown";

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
  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <TagSearchInput
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          tags={tags}
          placeholder="Search by title or tags..."
        />

        <TagFilterDropdown
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          tags={tags}
        />
      </div>
    </div>
  );
};