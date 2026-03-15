"use client";

import { useState, useEffect } from "react";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FileDownloadOutlined,
  RestartAltOutlined,
  CheckCircleOutlined,
} from "@mui/icons-material";
import { BackButton } from "@/app/components/ui/BackButton";
import { LoadingCircle } from "@/app/components/ui/LoadingCircle";
import { ExportModal, ExportFormat } from "@/app/components/moodboard/ExportModal";

interface MoodboardHeaderProps {
  title: string;
  color: string;
  collectionId: string;
  zoom: number;
  bgColor: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBgColorChange: (color: string) => void;
  onExport: (format: ExportFormat) => void;
  exporting: boolean;
  autosaveStatus: "idle" | "saving" | "saved";
  onReset: () => void;
}

export function MoodboardHeader({
  title,
  color,
  collectionId,
  zoom,
  bgColor,
  onZoomIn,
  onZoomOut,
  onBgColorChange,
  onExport,
  exporting,
  autosaveStatus,
  onReset,
}: MoodboardHeaderProps) {
  const [hexInput, setHexInput] = useState(bgColor.toUpperCase());
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setHexInput(bgColor.toUpperCase());
  }, [bgColor]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <BackButton
          href={`/dashboard/collections/${collectionId}`}
          label="Back to Collection"
        />

        <div className="w-px h-5 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded shrink-0"
            style={{ backgroundColor: color }}
          />
          <h1 className="text-sm font-semibold text-gray-900">
            {title} – Moodboard
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {autosaveStatus !== "idle" && (
          <div
            className={`mr-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              autosaveStatus === "saving"
                ? "bg-sky-50 text-sky-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {autosaveStatus === "saving" ? (
              <LoadingCircle size="sm" className="text-sky-600" label="Autosaving moodboard" />
            ) : (
              <CheckCircleOutlined sx={{ fontSize: 14 }} className="text-emerald-600" />
            )}
            <span>{autosaveStatus === "saving" ? "Autosaving..." : "Saved"}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Zoom out"
        >
          <ZoomOutOutlined sx={{ fontSize: 18 }} />
        </button>

        <span className="text-xs text-gray-500 w-10 text-center tabular-nums">
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Zoom in"
        >
          <ZoomInOutlined sx={{ fontSize: 18 }} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <label className="flex items-center gap-1.5 cursor-pointer" aria-label="Background color">
          <input
            type="color"
            value={bgColor}
            onChange={(e) => onBgColorChange(e.target.value)}
            className="w-6 h-6 rounded border border-gray-200 cursor-pointer p-0 appearance-none [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => {
              const val = e.target.value;
              setHexInput(val);
              const normalized = val.startsWith("#") ? val : "#" + val;
              if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
                onBgColorChange(normalized.toLowerCase());
              }
            }}
            onBlur={() => {
              const normalized = hexInput.startsWith("#") ? hexInput : "#" + hexInput;
              if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
                onBgColorChange(normalized.toLowerCase());
              } else {
                setHexInput(bgColor.toUpperCase());
              }
            }}
            maxLength={7}
            className="w-18 px-1.5 py-1 border border-gray-200 rounded text-xs text-gray-700 font-mono uppercase"
          />
        </label>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={onReset}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Reset layout"
          title="Reset layout"
        >
          <RestartAltOutlined sx={{ fontSize: 18 }} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-400 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <FileDownloadOutlined sx={{ fontSize: 16 }} />
          Export
        </button>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(format) => {
          onExport(format);
          setExportOpen(false);
        }}
        exporting={exporting}
      />
    </header>
  );
}
