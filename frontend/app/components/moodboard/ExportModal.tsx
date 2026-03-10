"use client";

import { useState } from "react";
import {
  PictureAsPdfOutlined,
  ImageOutlined,
} from "@mui/icons-material";
import { Modal } from "@/app/components/ui/Modal";

export type ExportFormat = "pdf" | "png" | "jpg";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  exporting: boolean;
}

const FORMAT_OPTIONS: { format: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
  {
    format: "pdf",
    label: "PDF",
    description: "Best for printing and sharing",
    icon: <PictureAsPdfOutlined sx={{ fontSize: 24 }} />,
  },
  {
    format: "png",
    label: "PNG",
    description: "Lossless quality with transparency",
    icon: <ImageOutlined sx={{ fontSize: 24 }} />,
  },
  {
    format: "jpg",
    label: "JPG",
    description: "Smaller file size, great for web",
    icon: <ImageOutlined sx={{ fontSize: 24 }} />,
  },
];

export function ExportModal({ open, onClose, onExport, exporting }: ExportModalProps) {
  const [selected, setSelected] = useState<ExportFormat>("png");

  return (
    <Modal open={open} onClose={onClose} title="Export Moodboard">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">Choose a format to export your moodboard.</p>

        <fieldset className="flex flex-col gap-2" disabled={exporting}>
          <legend className="sr-only">Export format</legend>
          {FORMAT_OPTIONS.map((opt) => (
            <label
              key={opt.format}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                selected === opt.format
                  ? "border-sky-400 bg-sky-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="export-format"
                value={opt.format}
                checked={selected === opt.format}
                onChange={() => setSelected(opt.format)}
                className="sr-only"
              />
              <span className={`${selected === opt.format ? "text-sky-500" : "text-gray-400"}`}>
                {opt.icon}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                <span className="text-xs text-gray-500">{opt.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onExport(selected)}
            disabled={exporting}
            className="px-4 py-2 text-sm font-semibold text-white bg-sky-400 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting…
              </>
            ) : (
              "Export"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
