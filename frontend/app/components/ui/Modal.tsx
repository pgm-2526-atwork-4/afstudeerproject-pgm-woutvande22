"use client";

import { useEffect, useRef } from "react";
import { CloseOutlined } from "@mui/icons-material";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "default" | "lg" | "xl" | "2xl";
}

export const Modal = ({ open, onClose, title, children, size = "default" }: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`bg-transparent p-0 m-auto w-full open:flex open:items-center open:justify-center ${
        size === "2xl" ? "max-w-6xl" : size === "xl" ? "max-w-4xl" : size === "lg" ? "max-w-2xl" : "max-w-lg"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <CloseOutlined sx={{ fontSize: 20 }} />
          </button>
        </header>

        <div className="px-6 py-5">{children}</div>
      </div>
    </dialog>
  );
};
