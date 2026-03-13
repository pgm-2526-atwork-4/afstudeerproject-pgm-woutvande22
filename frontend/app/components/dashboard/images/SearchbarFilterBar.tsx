"use client";

import { TagFilterDropdown, TagSearchInput } from "@/app/components/ui/TagFilterDropdown";
import { Switch } from "@/app/components/ui/Switch";

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
  showOnlyUncollected: boolean;
  onShowOnlyUncollectedChange: (value: boolean) => void;
}

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  tags,
  showOnlyUncollected,
  onShowOnlyUncollectedChange,
}: SearchFilterBarProps) => {
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4">
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

        <Switch
          checked={showOnlyUncollected}
          onChange={onShowOnlyUncollectedChange}
          label="Not in collection"
          ariaLabel="Show only images not in a collection"
        />
      </div>
    </div>
  );
};