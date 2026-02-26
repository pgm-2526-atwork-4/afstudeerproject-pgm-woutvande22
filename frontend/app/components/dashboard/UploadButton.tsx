"use client";

import { useState } from "react";
import { FileUploadOutlined } from "@mui/icons-material";
import { UploadImageModal } from "@/app/components/upload/UploadImageModal";

interface UploadButtonProps {
  onUploadSuccess?: () => void;
  collectionId?: number;
}

export const UploadButton = ({ onUploadSuccess, collectionId }: UploadButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      >
        <FileUploadOutlined sx={{ fontSize: 16 }} />
        Upload Image
      </button>

      <UploadImageModal
        open={open}
        onClose={() => setOpen(false)}
        onUploadSuccess={onUploadSuccess}
        collectionId={collectionId}
      />
    </>
  );
};