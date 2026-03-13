"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { FilePicker } from "./FilePicker";
import { ImagePreviewThumbnail } from "./ImagePreviewThumbnail";
import { FormInput } from "@/app/components/ui/FormInput";
import { TagSelector, type SelectedTag } from "./TagSelector";
import { uploadPhoto, getAiTagSuggestions } from "@/app/lib/photos";

interface UploadPreview {
  file: File;
  previewUrl: string;
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<UploadPreview[]>([]);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [description, setDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    setFiles([]);
    setPreviews([]);
    setTitle("");
    setSelectedTags([]);
    setDescription("");
    setAiLoading(false);
    setUploading(false);
    setError(null);
  }, [previews]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));

    setFiles(selectedFiles);
    setError(null);

    const nextPreviews = selectedFiles.map((selectedFile) => ({
      file: selectedFile,
      previewUrl: URL.createObjectURL(selectedFile),
    }));
    setPreviews(nextPreviews);

    const primaryFile = selectedFiles[0];
    if (!primaryFile) {
      setTitle("");
      setSelectedTags([]);
      setDescription("");
      return;
    }

    // Use the filename as title only for single-image uploads.
    const nameWithoutExt = primaryFile.name.replace(/\.[^/.]+$/, "");
    setTitle(selectedFiles.length === 1 ? nameWithoutExt : "");
    setSelectedTags([]);
    setDescription("");

    const token = localStorage.getItem("access_token");
    if (token && selectedFiles.length === 1) {
      setAiLoading(true);
      getAiTagSuggestions(token, primaryFile)
        .then((result) => {
          setSelectedTags(
            result.tags.map((name) => ({ name, color_hex: "#6B7280" }))
          );
          if (result.description) {
            setDescription(result.description);
          }
        })
        .catch((err) => {
          console.error("AI tagging failed:", err);
        })
        .finally(() => setAiLoading(false));
    } else {
      setAiLoading(false);
    }
  }, [previews]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (files.length === 0) {
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
        const tagNames = selectedTags.map((t) => t.name);
        const uploads = files.map((file) => {
          const derivedTitle = files.length === 1
            ? title || undefined
            : file.name.replace(/\.[^/.]+$/, "") || undefined;

          return uploadPhoto(
            token,
            file,
            collectionId,
            derivedTitle,
            tagNames.length > 0 ? tagNames : undefined,
            description || undefined
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
    [files, collectionId, title, description, selectedTags, onClose, onUploadSuccess, resetState]
  );

  return (
    <Modal open={open} onClose={handleClose} title="Upload Images">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <FilePicker
          fileNames={files.map((file) => file.name)}
          onFileSelect={handleFileSelect}
        />

        {previews.length > 0 && (
          <div className={`grid gap-3 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {previews.map((preview) => (
              <ImagePreviewThumbnail
                key={`${preview.file.name}-${preview.file.lastModified}`}
                src={preview.previewUrl}
                alt={preview.file.name}
                className={previews.length > 1 ? "aspect-square" : ""}
              />
            ))}
          </div>
        )}

        {files.length === 1 && (
          <FormInput
            id="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your image"
          />
        )}

        {files.length > 1 && (
          <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            Titles will default to each filename. Tags and description below will be applied to all selected images.
          </p>
        )}

        {files.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description {aiLoading && <span className="text-sky-500 text-xs">(AI is analyzing...)</span>}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for your image"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
            />
          </div>
        )}

        {files.length > 0 && (
          <TagSelector
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        )}

        {aiLoading && (
          <p className="text-sm text-sky-600 bg-sky-50 px-3 py-2 rounded-lg">
            AI is generating tags and description for your image…
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
            disabled={files.length === 0 || uploading}
            className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : `Upload ${files.length > 1 ? `${files.length} Images` : "Image"}`}
          </button>
        </footer>
      </form>
    </Modal>
  );
};
