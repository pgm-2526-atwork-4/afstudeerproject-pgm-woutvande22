"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOutlined } from "@mui/icons-material";
import { FormInput } from "@/app/components/ui/FormInput";
import { Button } from "@/app/components/ui/Button";
import { TagList } from "./TagList";
import type { Tag } from "@/app/lib/tags";
import type { Collection } from "@/app/lib/collections";

interface ImageDetailsFormProps {
  title: string;
  size: string;
  tags: Tag[];
  allTags: Tag[];
  tagsLoading?: boolean;
  collections?: Collection[];
  collectionsLoading?: boolean;
  onSave?: (title: string) => Promise<void>;
  onCancel?: () => void;
  onAddTag?: (tag: Tag) => void;
  onRemoveTag?: (tagId: number) => void;
  onCreateTag?: (name: string) => void;
}

export const ImageDetailsForm = ({
  title: initialTitle,
  size,
  tags,
  allTags,
  tagsLoading,
  collections = [],
  collectionsLoading,
  onSave,
  onCancel,
  onAddTag,
  onRemoveTag,
  onCreateTag,
}: ImageDetailsFormProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(title);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-6 flex-1" onSubmit={handleSubmit}>
      <FormInput 
        id="title" 
        label="Title" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title"
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Size</span>
        <p className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">
          {size}
        </p>
      </div>

      <TagList
        tags={tags}
        allTags={allTags}
        disabled={tagsLoading}
        onAdd={(tag) => onAddTag?.(tag)}
        onRemove={(tagId) => onRemoveTag?.(tagId)}
        onCreate={(name) => onCreateTag?.(name)}
      />

      {/* Collections this image belongs to */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Collections</span>
        {collectionsLoading ? (
          <p className="text-sm text-gray-400">Loading collections…</p>
        ) : collections.length === 0 ? (
          <p className="text-sm text-gray-400">Not in any collection</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/dashboard/collections/${col.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-lg text-sm text-gray-700 hover:text-sky-600 transition-colors"
              >
                <FolderOutlined sx={{ fontSize: 16 }} />
                {col.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      <Button type="button" className="w-auto self-start">
        Generate Tags
      </Button>

      <footer className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </footer>
    </form>
  );
};
