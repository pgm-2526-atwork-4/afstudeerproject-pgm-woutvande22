"use client";

import { SearchOutlined } from "@mui/icons-material";

interface Tag {
  id: number;
  name: string;
  color_hex: string;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string;
  onTagChange: (tag: string) => void;
  tags: Tag[];
}

export const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange,
  tags,
}: SearchFilterBarProps) => (
  <div className="flex items-center gap-4 mt-6">
    <div className="relative flex-1">
      <SearchOutlined
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        sx={{ fontSize: 18 }}
      />
      <input
        type="text"
        placeholder="Search by title or tag..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
      />
    </div>

    <select
      value={selectedTag}
      onChange={(e) => onTagChange(e.target.value)}
      className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent cursor-pointer"
    >
      <option value="">All tags</option>
      {tags.map((tag) => (
        <option key={tag.id} value={tag.name}>
          {tag.name}
        </option>
      ))}
    </select>
  </div>
);