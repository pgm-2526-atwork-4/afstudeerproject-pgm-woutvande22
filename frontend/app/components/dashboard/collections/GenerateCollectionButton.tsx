"use client";

import { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { GenerateCollectionModal } from "@/app/components/dashboard/collections/GenerateCollectionModal";

export const GenerateCollectionButton = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  return (
    <>
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none pl-56">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-full shadow-lg transition-colors cursor-pointer pointer-events-auto"
        >
          <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          Generate Collection
        </button>
      </div>

      <GenerateCollectionModal
        open={open}
        prompt={prompt}
        onClose={() => setOpen(false)}
        onPromptChange={setPrompt}
      />
    </>
  );
};