"use client";

import type { ReactNode } from "react";
import { FilterListOutlined } from "@mui/icons-material";
import { TagFilterDropdown, TagSearchInput } from "@/app/components/ui/TagFilterDropdown";
import { FilterSelect } from "@/app/components/ui/FilterSelect";

interface Tag {
  id: number;
  name: string;
  color_hex: string;
}

export type CollectionFilter = "all" | "in-collections" | "not-in-collection";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  tags: Tag[];
  collectionFilter: CollectionFilter;
  onCollectionFilterChange: (value: CollectionFilter) => void;
  trailingControl?: ReactNode;
}

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagsChange,
  tags,
  collectionFilter,
  onCollectionFilterChange,
  trailingControl,
}: SearchFilterBarProps) => {
  const collectionFilterOptions = [
    { value: "all", label: "All images" },
    { value: "in-collections", label: "In collections" },
    { value: "not-in-collection", label: "Not in collection" },
  ];

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

        <FilterSelect
          value={collectionFilter}
          onChange={(value) => onCollectionFilterChange(value as CollectionFilter)}
          options={collectionFilterOptions}
          ariaLabel="Show only images not in a collection"
          icon={<FilterListOutlined sx={{ fontSize: 18 }} />}
        />

        {trailingControl}
      </div>
    </div>
  );
};