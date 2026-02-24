"use client";

import { useState, useMemo } from "react";
import { SearchOutlined, KeyboardArrowDownOutlined } from "@mui/icons-material";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { TagRow } from "@/app/components/dashboard/TagRow";
import { TagForm } from "@/app/components/dashboard/TagForm";

interface Tag {
  id: string;
  name: string;
  color: string;
}

const initialTags: Tag[] = [
  { id: "1", name: "typography", color: "#6a5acd" },
  { id: "2", name: "branding", color: "#ff6b6b" },
  { id: "3", name: "color", color: "#4ecdc4" },
  { id: "4", name: "ui", color: "#ffe66d" },
  { id: "5", name: "layout", color: "#95e1d3" },
  { id: "6", name: "illustration", color: "#f38181" },
  { id: "7", name: "texture", color: "#c7a0ff" },
  { id: "8", name: "photography", color: "#ffa07a" },
];

export const TagsPage = () => {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "color">("name");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredTags = useMemo(() => {
    const filtered = tags.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.color.localeCompare(b.color);
    });
  }, [tags, search, sortBy]);

  const handleCreate = (name: string, color: string) => {
    const id = crypto.randomUUID();
    setTags((prev) => [...prev, { id, name, color }]);
    setCreating(false);
  };

  const handleEdit = (id: string, name: string, color: string) => {
    setTags((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name, color } : t))
    );
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <section className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Tags"
            description="Manage and organize your image tags"
          />
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setEditingId(null);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            + Create Tag
          </button>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1">
            <SearchOutlined
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              sx={{ fontSize: 18 }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "color")}
              className="appearance-none px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent cursor-pointer"
            >
              <option value="name">Sort by</option>
              <option value="name">Name</option>
              <option value="color">Color</option>
            </select>
            <KeyboardArrowDownOutlined
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              sx={{ fontSize: 16 }}
            />
          </div>
        </div>
      </div>

      <div className="px-8 mt-4">
        <nav className="flex gap-4 mb-6" aria-label="Tag filter">
          <span className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
            All Images
          </span>
          <span className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
            Your Collections
          </span>
        </nav>

        {creating && (
          <div className="mb-4">
            <TagForm
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        <ul className="flex flex-col gap-3" role="list" aria-label="Tags">
          {filteredTags.map((tag) =>
            editingId === tag.id ? (
              <li key={tag.id}>
                <TagForm
                  initialName={tag.name}
                  initialColor={tag.color}
                  onSave={(name, color) => handleEdit(tag.id, name, color)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <TagRow
                key={tag.id}
                name={tag.name}
                color={tag.color}
                onEdit={() => {
                  setEditingId(tag.id);
                  setCreating(false);
                }}
                onDelete={() => handleDelete(tag.id)}
              />
            )
          )}

          {filteredTags.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400">
              No tags found.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
};
