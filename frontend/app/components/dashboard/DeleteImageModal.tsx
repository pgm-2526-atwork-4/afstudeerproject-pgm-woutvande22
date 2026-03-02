"use client";

import { Modal } from "@/app/components/ui/Modal";

interface DeleteImageModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  isCollectionRemove?: boolean;
}

export const DeleteImageModal = ({ open, onClose, onConfirm, isDeleting, isCollectionRemove }: DeleteImageModalProps) => (
  <Modal open={open} onClose={onClose} title={isCollectionRemove ? "Remove Image" : "Delete Image"}>
    <div className="space-y-4">
      <div className={`flex items-start gap-3 p-3 border rounded-lg ${
        isCollectionRemove
          ? "bg-blue-50 border-blue-200"
          : "bg-amber-50 border-amber-200"
      }`}>
        <svg className={`w-5 h-5 shrink-0 mt-0.5 ${
          isCollectionRemove ? "text-blue-600" : "text-amber-600"
        }`} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <p className={`text-sm ${
          isCollectionRemove ? "text-blue-800" : "text-amber-800"
        }`}>
          {isCollectionRemove
            ? "This will remove the image from this collection. The image itself will not be deleted."
            : <>This will permanently delete the image from <strong>every collection</strong> it belongs to. This action cannot be undone.</>}
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          disabled={isDeleting}
        >
          {isDeleting ? (isCollectionRemove ? "Removing..." : "Deleting...") : (isCollectionRemove ? "Remove" : "Delete Image")}
        </button>
      </div>
    </div>
  </Modal>
);
