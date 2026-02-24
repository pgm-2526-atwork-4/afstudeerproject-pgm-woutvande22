"use client";

import { FormInput } from "@/app/components/ui/FormInput";
import { Button } from "@/app/components/ui/Button";
import { TagList } from "./TagList";

interface ImageDetailsFormProps {
  title: string;
  size: string;
  tags: string[];
}

export const ImageDetailsForm = ({ title, size, tags }: ImageDetailsFormProps) => (
  <form
    className="flex flex-col gap-6 flex-1"
    onSubmit={(e) => e.preventDefault()}
  >
    <FormInput id="title" label="Title" placeholder={title} />

    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-gray-700">Size</span>
      <p className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50">
        {size}
      </p>
    </div>

    <TagList tags={tags} />

    <Button type="button" className="w-auto self-start">
      Generate Tags
    </Button>

    <footer className="flex justify-end gap-3 mt-4">
      <button
        type="button"
        className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      >
        Save
      </button>
    </footer>
  </form>
);
