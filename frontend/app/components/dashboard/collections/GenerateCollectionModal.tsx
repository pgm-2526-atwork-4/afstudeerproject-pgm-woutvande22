"use client";

import { Button } from "@/app/components/ui/Button";
import { FormInput } from "@/app/components/ui/FormInput";
import { Modal } from "@/app/components/ui/Modal";

interface GenerateCollectionModalProps {
  open: boolean;
  prompt: string;
  onClose: () => void;
  onPromptChange: (value: string) => void;
}

const promptTags = [
  "typography",
  "branding",
  "color",
  "ui",
  "layout",
  "illustration",
  "texture",
  "photography",
];

export const GenerateCollectionModal = ({
  open,
  prompt,
  onClose,
  onPromptChange,
}: GenerateCollectionModalProps) => {
  return (
    <Modal open={open} onClose={onClose} title="Generate Collection" size="xl">
      <div className="flex flex-col gap-6">
        <FormInput
          id="collection-generation-prompt"
          label="Prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Enter generation prompt..."
        />

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-700">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {promptTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <footer className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <Button type="button" disabled className="w-auto px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
            Generate
          </Button>
        </footer>
      </div>
    </Modal>
  );
};