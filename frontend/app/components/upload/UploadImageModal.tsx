"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { FilePicker } from "./FilePicker";
import { FormInput } from "@/app/components/ui/FormInput";
import { TagSelector, type SelectedTag } from "./TagSelector";
import { LoadingCircle } from "@/app/components/ui/LoadingCircle";
import { UploadPreviewCarousel } from "./UploadPreviewCarousel";
import { UploadAnalysisProgressBar } from "./UploadAnalysisProgressBar";
import { uploadPhoto, getAiTagSuggestions } from "@/app/lib/photos";
import { fetchTags, type Tag } from "@/app/lib/tags";
import { getDeterministicTagColor } from "@/app/lib/color";
import { dispatchSidebarCountsChanged } from "@/app/lib/events";

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  selectedTags: SelectedTag[];
  aiSuggestedTags: SelectedTag[];
  tagsTouched: boolean;
  description: string;
  aiLoading: boolean;
}

interface UploadImageModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  collectionId?: number;
}

const normalizeAiTagName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const tokenize = (value: string): string[] =>
  normalizeAiTagName(value)
    .split("-")
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);

const isSharedTagRelevantToItem = (tagName: string, item: UploadItem): boolean => {
  const tagTokens = tokenize(tagName);
  if (tagTokens.length === 0) return false;

  const textBlob = `${item.title} ${item.description}`;
  const itemTokens = new Set(tokenize(textBlob));

  return tagTokens.some((token) => itemTokens.has(token));
};

const dedupeTags = (tags: SelectedTag[]): SelectedTag[] => {
  const deduped: SelectedTag[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const normalized = normalizeAiTagName(tag.name);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(tag);
  }

  return deduped;
};

const applySharedAiTags = (items: UploadItem[]): UploadItem[] => {
  const frequency = new Map<string, number>();
  const canonicalByName = new Map<string, SelectedTag>();

  for (const item of items) {
    const namesInItem = new Set<string>();
    for (const tag of item.aiSuggestedTags) {
      const normalized = normalizeAiTagName(tag.name);
      if (!normalized || namesInItem.has(normalized)) continue;
      namesInItem.add(normalized);
      frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1);
      if (!canonicalByName.has(normalized)) {
        canonicalByName.set(normalized, tag);
      }
    }
  }

  const sharedTags = [...frequency.entries()]
    .filter(([, count]) => count >= 2)
    .map(([name]) => canonicalByName.get(name))
    .filter((tag): tag is SelectedTag => Boolean(tag));

  if (sharedTags.length === 0) return items;

  return items.map((item) => {
    if (item.tagsTouched || item.aiLoading) {
      return item;
    }

    const relevantSharedTags = sharedTags.filter((tag) =>
      isSharedTagRelevantToItem(tag.name, item)
    );

    if (relevantSharedTags.length === 0) {
      return item;
    }

    const merged = dedupeTags([...item.aiSuggestedTags, ...relevantSharedTags]).slice(0, 10);
    return {
      ...item,
      selectedTags: merged,
    };
  });
};

export const UploadImageModal = ({
  open,
  onClose,
  onUploadSuccess,
  collectionId,
}: UploadImageModalProps) => {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetchTags(token)
      .then(setExistingTags)
      .catch(() => {});
  }, []);

  const activeUpload = uploadItems.find((item) => item.id === activeUploadId) ?? uploadItems[0] ?? null;
  const hasAiLoading = uploadItems.some((item) => item.aiLoading);
  const analyzedCount = uploadItems.filter((item) => !item.aiLoading).length;

  const activeUploadIndex = useMemo(
    () => Math.max(0, uploadItems.findIndex((item) => item.id === activeUpload?.id)),
    [uploadItems, activeUpload]
  );

  const handlePrevUpload = useCallback(() => {
    if (uploadItems.length <= 1) return;
    const nextIndex = (activeUploadIndex - 1 + uploadItems.length) % uploadItems.length;
    setActiveUploadId(uploadItems[nextIndex]?.id ?? null);
  }, [activeUploadIndex, uploadItems]);

  const handleNextUpload = useCallback(() => {
    if (uploadItems.length <= 1) return;
    const nextIndex = (activeUploadIndex + 1) % uploadItems.length;
    setActiveUploadId(uploadItems[nextIndex]?.id ?? null);
  }, [activeUploadIndex, uploadItems]);

  const resetState = useCallback(() => {
    uploadItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setUploadItems([]);
    setActiveUploadId(null);
    setUploading(false);
    setError(null);
  }, [uploadItems]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const updateUploadItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setUploadItems((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    uploadItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setError(null);

    if (selectedFiles.length === 0) {
      setUploadItems([]);
      setActiveUploadId(null);
      return;
    }

    const token = localStorage.getItem("access_token");
    const nextItems = selectedFiles.map((selectedFile, index) => ({
      id: `${selectedFile.name}-${selectedFile.lastModified}-${index}`,
      file: selectedFile,
      previewUrl: URL.createObjectURL(selectedFile),
      title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      selectedTags: [],
      aiSuggestedTags: [],
      tagsTouched: false,
      description: "",
      aiLoading: Boolean(token),
    }));

    setUploadItems(nextItems);
    setActiveUploadId(nextItems[0]?.id ?? null);

    if (!token) {
      return;
    }

    nextItems.forEach((item) => {
      getAiTagSuggestions(token, item.file)
        .then((result) => {
          const existingByNormalized = new Map<string, Tag>();
          for (const tag of existingTags) {
            existingByNormalized.set(normalizeAiTagName(tag.name), tag);
          }

          const selectedTags: SelectedTag[] = [];
          const usedNames = new Set<string>();

          for (const rawName of result.tags) {
            const normalizedName = normalizeAiTagName(rawName);
            if (!normalizedName) continue;

            const existing = existingByNormalized.get(normalizedName);
            const aiColor = result.tag_colors?.[normalizedName] || result.tag_colors?.[rawName];
            const nextTag: SelectedTag = existing
              ? { id: existing.id, name: existing.name, color_hex: existing.color_hex }
              : { name: normalizedName, color_hex: aiColor || getDeterministicTagColor(normalizedName) };

            const dedupeKey = nextTag.name.toLowerCase();
            if (usedNames.has(dedupeKey)) continue;
            usedNames.add(dedupeKey);
            selectedTags.push(nextTag);
          }

          setUploadItems((current) => {
            const updated = current.map((uploadItem) =>
              uploadItem.id === item.id
                ? {
                    ...uploadItem,
                    aiSuggestedTags: selectedTags,
                    selectedTags,
                    description: result.description || "",
                    aiLoading: false,
                  }
                : uploadItem
            );

            return applySharedAiTags(updated);
          });
        })
        .catch((err) => {
          console.error("AI tagging failed:", err);
          setUploadItems((current) =>
            current.map((uploadItem) =>
              uploadItem.id === item.id ? { ...uploadItem, aiLoading: false } : uploadItem
            )
          );
        });
    });
  }, [existingTags, uploadItems]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (uploadItems.length === 0) {
        setError("Please select at least one file first.");
        return;
      }

      if (hasAiLoading) {
        setError("Please wait for AI tags to finish generating before uploading.");
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("You must be logged in to upload.");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const uploads = uploadItems.map((item) => {
          const tagNames = item.selectedTags.map((tag) => tag.name);
          const tagItems = item.selectedTags.map((tag) => ({
            name: tag.name,
            color_hex: tag.color_hex,
          }));

          return uploadPhoto(
            token,
            item.file,
            collectionId,
            item.title || undefined,
            tagNames.length > 0 ? tagNames : undefined,
            item.description || undefined,
            tagItems.length > 0 ? tagItems : undefined
          );
        });

        const results = await Promise.allSettled(uploads);
        const failures = results.filter((result) => result.status === "rejected");

        if (failures.length === results.length) {
          const firstFailure = failures[0];
          if (firstFailure?.status === "rejected") {
            throw firstFailure.reason;
          }
          throw new Error("Upload failed");
        }

        resetState();
        onClose();
        onUploadSuccess?.();
        dispatchSidebarCountsChanged();

        if (failures.length > 0) {
          console.error("Some uploads failed:", failures);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [uploadItems, hasAiLoading, collectionId, onClose, onUploadSuccess, resetState]
  );

  return (
    <Modal open={open} onClose={handleClose} title="Upload Images" size="2xl">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {uploadItems.length === 0 && (
          <FilePicker
            fileNames={uploadItems.map((item) => item.file.name)}
            onFileSelect={handleFileSelect}
          />
        )}

        {uploadItems.length > 0 && (
          <UploadAnalysisProgressBar
            analyzedCount={analyzedCount}
            totalCount={uploadItems.length}
          />
        )}

        {uploadItems.length > 0 && (
          <UploadPreviewCarousel
            items={uploadItems.map((item) => ({
              id: item.id,
              title: item.title,
              fileName: item.file.name,
              previewUrl: item.previewUrl,
              aiLoading: item.aiLoading,
              tagCount: item.selectedTags.length,
            }))}
            activeId={activeUpload?.id ?? null}
            onSelect={setActiveUploadId}
            onPrev={handlePrevUpload}
            onNext={handleNextUpload}
          />
        )}

        {uploadItems.length > 1 && activeUpload && (
          <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            Edit the metadata for the selected image below. Each image keeps its own title, description, and tags.
          </p>
        )}

        {activeUpload && (
          <FormInput
            id="title"
            label="Title"
            value={activeUpload.title}
            onChange={(e) => updateUploadItem(activeUpload.id, { title: e.target.value })}
            placeholder="Enter a title for your image"
          />
        )}

        {activeUpload && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description {activeUpload.aiLoading && <span className="text-sky-500 text-xs">(AI is analyzing...)</span>}
            </label>
            <textarea
              id="description"
              value={activeUpload.description}
              onChange={(e) => updateUploadItem(activeUpload.id, { description: e.target.value })}
              placeholder="Enter a description for your image"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
            />
          </div>
        )}

        {activeUpload && (
          <TagSelector
            selectedTags={activeUpload.selectedTags}
            onChange={(tags) => updateUploadItem(activeUpload.id, { selectedTags: tags, tagsTouched: true })}
          />
        )}

        {hasAiLoading && (
          <div className="flex items-center gap-2 text-sm text-sky-600 bg-sky-50 px-3 py-2 rounded-lg">
            <LoadingCircle size="sm" className="text-sky-600" label="Generating AI tags and descriptions" />
            <p>AI is generating tags and descriptions for your selected images...</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <footer className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadItems.length === 0 || uploading || hasAiLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading && <LoadingCircle size="sm" className="text-white" label="Uploading images" />}
            <span>{uploading ? "Uploading..." : `Upload ${uploadItems.length > 1 ? `${uploadItems.length} Images` : "Image"}`}</span>
          </button>
        </footer>
      </form>
    </Modal>
  );
};
