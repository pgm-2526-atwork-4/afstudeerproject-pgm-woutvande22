"use client";

import { useState } from "react";
import { FormInput } from "@/app/components/ui/FormInput";
import { Button } from "@/app/components/ui/Button";
import { TagList } from "./TagList";
import type { Tag } from "@/app/lib/tags";

interface ImageDetailsFormProps {
  title: string;
  size: string;
  tags: Tag[];
  allTags: Tag[];
  tagsLoading?: boolean;
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
