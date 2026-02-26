"use client";

import { Modal } from "@/app/components/ui/Modal";
import { FilePicker } from "./FilePicker";
import { ImagePreviewThumbnail } from "./ImagePreviewThumbnail";
import { TagGenerationProgress } from "./TagGenerationProgress";
import { TagInput } from "./TagInput";
import { CollectionPicker } from "./CollectionPicker";

type UploadStep = "choose" | "generating" | "details";

interface UploadImageModalProps {
  open: boolean;
  onClose: () => void;
  step?: UploadStep;
}

const STATIC_TAGS = ["design", "creative", "modern"];

const STATIC_COLLECTIONS = [
  { id: "brand-assets-2024", title: "Brand Assets 2024" },
  { id: "ui-inspiration", title: "UI Inspiration" },
  { id: "typography-studies", title: "Typography Studies" },
];

export const UploadImageModal = ({
  open,
  onClose,
  step = "details",
}: UploadImageModalProps) => {
  const hasFile = step !== "choose";
  const isGenerating = step === "generating";
  const showDetails = step === "details";

  return (
    <Modal open={open} onClose={onClose} title="Upload Image">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <FilePicker />

        {hasFile && <ImagePreviewThumbnail />}

        {isGenerating && <TagGenerationProgress progress={40} />}

        {(isGenerating || showDetails) && (
          <TagInput tags={showDetails ? STATIC_TAGS : []} />
        )}

        {showDetails && (
          <CollectionPicker
            collections={STATIC_COLLECTIONS}
            showCreateForm={false}
          />
        )}

        <footer className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Confirm
          </button>
        </footer>
      </form>
    </Modal>
  );
};
