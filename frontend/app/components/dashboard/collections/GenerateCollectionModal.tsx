"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/app/components/ui/Button";
import { FormInput } from "@/app/components/ui/FormInput";
import { Modal } from "@/app/components/ui/Modal";
import {
  addPhotoToCollection,
  createCollection,
  previewCollectionWithAi,
} from "@/app/lib/collections";
import { dispatchCollectionsChanged } from "@/app/lib/events";
import { fetchPhotos, type Photo } from "@/app/lib/photos";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface GenerateCollectionModalProps {
  open: boolean;
  prompt: string;
  onClose: () => void;
  onPromptChange: (value: string) => void;
}

export const GenerateCollectionModal = ({
  open,
  prompt,
  onClose,
  onPromptChange,
}: GenerateCollectionModalProps) => {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [reviewStep, setReviewStep] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<number>>(new Set());

  const isBusy = loadingPreview || creating;

  const resetState = () => {
    setError("");
    setReviewStep(false);
    setTitle("");
    setSelectedTags([]);
    setAllPhotos([]);
    setSelectedPhotoIds(new Set());
  };

  const handleClose = () => {
    if (isBusy) return;
    resetState();
    onPromptChange("");
    onClose();
  };

  const handleGeneratePreview = async () => {
    setError("");

    if (!prompt.trim()) {
      setError("Please enter a prompt to generate a collection.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in.");
      return;
    }

    setLoadingPreview(true);
    try {
      const [preview, photos] = await Promise.all([
        previewCollectionWithAi(token, { prompt: prompt.trim() }),
        fetchPhotos(token),
      ]);

      setTitle(preview.suggested_title);
      setSelectedTags(preview.selected_tags);
      setAllPhotos(photos);
      setSelectedPhotoIds(new Set(preview.suggested_photo_ids));
      setReviewStep(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate collection preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const togglePhotoSelection = (photoId: number) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectedPhotos = allPhotos.filter((photo) => selectedPhotoIds.has(photo.id));

  const handleCreateCollection = async () => {
    setError("");

    if (!title.trim()) {
      setError("Collection title is required.");
      return;
    }

    if (selectedPhotoIds.size === 0) {
      setError("Select at least one image before creating the collection.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in.");
      return;
    }

    setCreating(true);
    try {
      const createdCollection = await createCollection(token, {
        title: title.trim(),
      });

      const photoIds = Array.from(selectedPhotoIds);
      await Promise.all(
        photoIds.map((photoId) => addPhotoToCollection(token, createdCollection.id, photoId))
      );

      dispatchCollectionsChanged();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Generate Collection" size="2xl">
      <section className="flex flex-col gap-6">
        {!reviewStep ? (
          <FormInput
            id="collection-generation-prompt"
            label="Prompt"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter generation prompt..."
          />
        ) : (
          <>
            <FormInput
              id="collection-generated-title"
              label="Collection title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Collection title"
            />

            <section className="flex flex-col gap-3">
              <p className="text-sm text-gray-600">
                Review your generated selection and remove images before creating the collection.
              </p>
              <p className="text-xs text-gray-500">
                {selectedPhotoIds.size} selected {selectedTags.length > 0 ? `- tags: ${selectedTags.join(", ")}` : ""}
              </p>
              <div className="max-h-[65vh] overflow-y-auto border border-gray-200 rounded-lg p-4">
                {selectedPhotos.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No images selected.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedPhotos.map((photo) => {
                    const selected = selectedPhotoIds.has(photo.id);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => togglePhotoSelection(photo.id)}
                        className={`relative overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${
                          selected ? "border-sky-400" : "border-transparent"
                        }`}
                        aria-pressed={selected}
                      >
                        <Image
                          src={photo.url}
                          alt={photo.title || `Photo ${photo.id}`}
                          width={400}
                          height={240}
                          className="h-36 w-full object-cover"
                        />
                        <span
                          className={`absolute right-2 top-2 text-xs font-semibold rounded px-2 py-1 ${
                            selected ? "bg-sky-500 text-white" : "bg-black/50 text-white"
                          }`}
                        >
                          {selected ? "Selected" : "Removed"}
                        </span>
                      </button>
                    );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <footer className="flex justify-end gap-3 pt-2">
          {reviewStep && (
            <button
              type="button"
              onClick={() => {
                setReviewStep(false);
                setError("");
              }}
              disabled={isBusy}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <Button
            type="button"
            onClick={reviewStep ? handleCreateCollection : handleGeneratePreview}
            disabled={
              isBusy ||
              (!reviewStep && !prompt.trim()) ||
              (reviewStep && selectedPhotoIds.size === 0)
            }
            className="w-auto px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-2">
              <AutoAwesomeIcon sx={{ fontSize: 18 }} />
              {!reviewStep
                ? loadingPreview
                  ? "Generating..."
                  : "Generate"
                : creating
                  ? "Creating..."
                  : "Create Collection"}
            </span>
          </Button>
        </footer>
      </section>
    </Modal>
  );
};