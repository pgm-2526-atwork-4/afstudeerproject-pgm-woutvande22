"use client";

import { SearchOutlined } from "@mui/icons-material";

interface CollectionSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const CollectionSearchBar = ({
  searchQuery,
  onSearchChange,
}: CollectionSearchBarProps) => (
  <div className="flex items-center gap-4">
    <div className="relative flex-1">
      <SearchOutlined
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        sx={{ fontSize: 18 }}
      />
      <input
        type="text"
        placeholder="Search collections..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
      />
    </div>
  </div>
);
