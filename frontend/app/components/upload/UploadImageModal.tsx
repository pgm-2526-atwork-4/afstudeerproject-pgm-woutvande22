"use client";

import { useCallback, useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { FilePicker } from "./FilePicker";
import { ImagePreviewThumbnail } from "./ImagePreviewThumbnail";
import { FormInput } from "@/app/components/ui/FormInput";
import { TagSelector, type SelectedTag } from "./TagSelector";
import { uploadPhoto, getAiTagSuggestions } from "@/app/lib/photos";

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  selectedTags: SelectedTag[];
  description: string;
  aiLoading: boolean;
}

interface UploadImageModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  collectionId?: number;
}

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

  const activeUpload = uploadItems.find((item) => item.id === activeUploadId) ?? uploadItems[0] ?? null;
  const hasAiLoading = uploadItems.some((item) => item.aiLoading);

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
          updateUploadItem(item.id, {
            selectedTags: result.tags.map((name) => ({ name, color_hex: "#6B7280" })),
            description: result.description || "",
            aiLoading: false,
          });
        })
        .catch((err) => {
          console.error("AI tagging failed:", err);
          updateUploadItem(item.id, { aiLoading: false });
        });
    });
  }, [updateUploadItem, uploadItems]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (uploadItems.length === 0) {
        setError("Please select at least one file first.");
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

          return uploadPhoto(
            token,
            item.file,
            collectionId,
            item.title || undefined,
            tagNames.length > 0 ? tagNames : undefined,
            item.description || undefined
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

        if (failures.length > 0) {
          console.error("Some uploads failed:", failures);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [uploadItems, collectionId, onClose, onUploadSuccess, resetState]
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
          <div className={`grid gap-3 ${uploadItems.length === 1 ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"}`}>
            {uploadItems.map((item) => {
              const isActive = activeUpload?.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveUploadId(item.id)}
                  className={`overflow-hidden rounded-xl border text-left transition-all cursor-pointer ${
                    isActive
                      ? "border-sky-400 ring-2 ring-sky-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <ImagePreviewThumbnail
                    src={item.previewUrl}
                    alt={item.file.name}
                    className={uploadItems.length > 1 ? "aspect-4/3 max-h-36" : "max-h-64"}
                  />
                  <div className="bg-white px-3 py-2">
                    <p className="truncate text-sm font-medium text-gray-800">{item.title || item.file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.aiLoading ? "Analyzing..." : `${item.selectedTags.length} tag${item.selectedTags.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
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
            onChange={(tags) => updateUploadItem(activeUpload.id, { selectedTags: tags })}
          />
        )}

        {hasAiLoading && (
          <p className="text-sm text-sky-600 bg-sky-50 px-3 py-2 rounded-lg">
            AI is generating tags and descriptions for your selected images…
          </p>
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
            disabled={uploadItems.length === 0 || uploading}
            className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : `Upload ${uploadItems.length > 1 ? `${uploadItems.length} Images` : "Image"}`}
          </button>
        </footer>
      </form>
    </Modal>
  );
};
