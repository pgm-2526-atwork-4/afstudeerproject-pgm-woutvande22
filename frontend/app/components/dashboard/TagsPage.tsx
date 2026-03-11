"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { SearchOutlined, KeyboardArrowDownOutlined } from "@mui/icons-material";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { TagRow } from "@/app/components/dashboard/TagRow";
import { TagForm } from "@/app/components/dashboard/TagForm";
import { Modal } from "@/app/components/ui/Modal";
import { fetchTags, createTag, updateTag, deleteTag } from "@/app/lib/tags";

interface TagItem {
  id: string;
  name: string;
  color: string;
}

export const TagsPage = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "color">("name");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTags = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchTags(token);
      setTags(data.map((t) => ({
        id: String(t.id),
        name: t.name,
        color: t.color_hex,
      })));
    } catch (err) {
      console.error("Failed to load tags:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const filteredTags = useMemo(() => {
    const filtered = tags.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return a.color.localeCompare(b.color);
    });
  }, [tags, search, sortBy]);

  const handleCreate = async (name: string, color: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("No access token found");
      return;
    }

    // Check for duplicate tag name
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("A tag with this name already exists");
    }

    try {
      console.log("Creating tag with token:", token.substring(0, 20) + "...");
      const newTag = await createTag(token, name, color);
      setTags((prev) => [...prev, {
        id: String(newTag.id),
        name: newTag.name,
        color: newTag.color_hex,
      }]);
      setCreating(false);
    } catch (err) {
      console.error("Failed to create tag:", err);
      throw err;
    }
  };

  const handleEdit = async (id: string, name: string, color: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      await updateTag(token, Number(id), { name, color_hex: color });
      setTags((prev) =>
        prev.map((t) => (t.id === id ? { ...t, name, color } : t))
      );
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update tag:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      await deleteTag(token, Number(id));
      setTags((prev) => prev.filter((t) => t.id !== id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete tag:", err);
    } finally {
      setIsDeleting(false);
    }
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

        {creating && (
          <div className="mb-4">
            <TagForm
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading tags...</p>
        ) : (
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
                  onDelete={() => setDeleteTarget(tag)}
                />
              )
            )}

            {filteredTags.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-400">
                No tags found.
              </li>
            )}
          </ul>
        )}
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Tag"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 border rounded-lg bg-amber-50 border-amber-200">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-amber-800">
              This will permanently delete the tag{" "}
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: deleteTarget?.color ?? "#6B7280" }}
              >
                {deleteTarget?.name}
              </span>{" "}
              and remove it from <strong>all images</strong>. This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete Tag"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};
