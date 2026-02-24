"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowBackOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FileDownloadOutlined,
} from "@mui/icons-material";

interface MoodboardHeaderProps {
  title: string;
  color: string;
  collectionId: string;
  zoom: number;
  bgColor: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBgColorChange: (color: string) => void;
  onExport: () => void;
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
}: MoodboardHeaderProps) {
  const [hexInput, setHexInput] = useState(bgColor.toUpperCase());

  useEffect(() => {
    setHexInput(bgColor.toUpperCase());
  }, [bgColor]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/collections/${collectionId}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowBackOutlined sx={{ fontSize: 16 }} />
          Back to Collection
        </Link>

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
            className="w-[4.5rem] px-1.5 py-1 border border-gray-200 rounded text-xs text-gray-700 font-mono uppercase"
          />
        </label>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-400 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <FileDownloadOutlined sx={{ fontSize: 16 }} />
          Export
        </button>
      </div>
    </header>
  );
}
