"use client";

import { useState } from "react";
import { PlayCircleOutline } from "@mui/icons-material";
import { Modal } from "@/app/components/ui/Modal";

interface WatchDemoModalProps {
  videoSrc?: string;
}

export const WatchDemoModal = ({ videoSrc }: WatchDemoModalProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-8 py-3 border border-gray-300 hover:border-gray-400 text-gray-900 font-medium rounded-lg transition-colors bg-white inline-flex items-center gap-2"
      >
        <PlayCircleOutline sx={{ fontSize: 20 }} />
        Watch Demo
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Product Demo"
        size="2xl"
      >
        {videoSrc ? (
          <video
            controls
            className="w-full aspect-video rounded-xl bg-black"
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full aspect-video rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-center px-6">
            <p className="text-sm text-gray-600">
              Add your demo file by passing a video path to the component.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};