"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderOutlined, CalendarTodayOutlined, StraightenOutlined, ImageOutlined, AutoAwesomeOutlined } from "@mui/icons-material";
import { FormInput } from "@/app/components/ui/FormInput";
import { Button } from "@/app/components/ui/Button";
import { TagList } from "../tags/TagList";
import type { Tag } from "@/app/lib/tags";
import type { Collection } from "@/app/lib/collections";

interface ImageDetailsFormProps {
  title: string;
  size: string;
  dimensions?: string;
  uploadedAt?: string;
  tags: Tag[];
  allTags: Tag[];
  tagsLoading?: boolean;
  collections?: Collection[];
  collectionsLoading?: boolean;
  description?: string;
  onSave?: (title: string) => Promise<void>;
  onCancel?: () => void;
  onAddTag?: (tag: Tag) => void;
  onRemoveTag?: (tagId: number) => void;
  onCreateTag?: (name: string) => void;
  onGenerateTags?: () => Promise<void>;
}

export const ImageDetailsForm = ({
  title: initialTitle,
  size,
  dimensions,
  uploadedAt,
  tags,
  allTags,
  tagsLoading,
  collections = [],
  collectionsLoading,
  description,
  onSave,
  onCancel,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  onGenerateTags,
}: ImageDetailsFormProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const formattedDate = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  return (
    <div className="flex flex-col gap-8 flex-1">
      {/* ── Editable section ── */}
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <FormInput 
          id="title" 
          label="Title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title"
        />

        <TagList
          tags={tags}
          allTags={allTags}
          disabled={tagsLoading}
          onAdd={(tag) => onAddTag?.(tag)}
          onRemove={(tagId) => onRemoveTag?.(tagId)}
          onCreate={(name) => onCreateTag?.(name)}
        />

        <Button
          type="button"
          className="w-auto self-start"
          disabled={isGenerating || !onGenerateTags}
          onClick={async () => {
            if (!onGenerateTags) return;
            setIsGenerating(true);
            try {
              await onGenerateTags();
            } catch (err) {
              console.error("Failed to generate tags:", err);
            } finally {
              setIsGenerating(false);
            }
          }}
        >
          {isGenerating ? "Generating..." : "Generate Tags"}
        </Button>

        <footer className="flex justify-end gap-3">
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

      {/* ── Metadata section ── */}
      <div className="border-t border-gray-200 pt-6 flex flex-col gap-5">
        <h3 className="text-sm font-semibold text-gray-900">Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2.5">
            <StraightenOutlined className="text-gray-400 mt-0.5" sx={{ fontSize: 18 }} />
            <div>
              <p className="text-xs text-gray-400">File Size</p>
              <p className="text-sm text-gray-700">{size}</p>
            </div>
          </div>

          {formattedDate && (
            <div className="flex items-start gap-2.5">
              <CalendarTodayOutlined className="text-gray-400 mt-0.5" sx={{ fontSize: 18 }} />
              <div>
                <p className="text-xs text-gray-400">Uploaded</p>
                <p className="text-sm text-gray-700">{formattedDate}</p>
              </div>
            </div>
          )}

          {dimensions && (
            <div className="flex items-start gap-2.5">
              <ImageOutlined className="text-gray-400 mt-0.5" sx={{ fontSize: 18 }} />
              <div>
                <p className="text-xs text-gray-400">Dimensions</p>
                <p className="text-sm text-gray-700">{dimensions}</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Description */}
        {description && (
          <div className="flex items-start gap-2.5">
            <AutoAwesomeOutlined className="text-gray-400 mt-0.5" sx={{ fontSize: 18 }} />
            <div>
              <p className="text-xs text-gray-400">AI Description</p>
              <p className="text-sm text-gray-700">{description}</p>
            </div>
          </div>
        )}

        {/* Collections */}
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
      </div>
    </div>
  );
};
