"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { FilePicker } from "./FilePicker";
import { ImagePreviewThumbnail } from "./ImagePreviewThumbnail";
import { FormInput } from "@/app/components/ui/FormInput";
import { TagSelector, type SelectedTag } from "./TagSelector";
import { uploadPhoto } from "@/app/lib/photos";

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
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setSelectedTags([]);
    setUploading(false);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    // Set default title from filename (without extension)
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    setTitle(nameWithoutExt);

    // Create a local preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!file) {
        setError("Please select a file first.");
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
        await uploadPhoto(token, file, collectionId, title || undefined, tagNames.length > 0 ? tagNames : undefined);
        resetState();
        onClose();
        onUploadSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [file, collectionId, title, selectedTags, onClose, onUploadSuccess, resetState]
  );

  return (
    <Modal open={open} onClose={handleClose} title="Upload Image">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <FilePicker
          fileName={file?.name}
          onFileSelect={handleFileSelect}
        />

        {previewUrl && (
          <ImagePreviewThumbnail src={previewUrl} alt={file?.name} />
        )}

        {file && (
          <FormInput
            id="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your image"
          />
        )}

        {file && (
          <TagSelector
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
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
            disabled={!file || uploading}
            className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </footer>
      </form>
    </Modal>
  );
};
