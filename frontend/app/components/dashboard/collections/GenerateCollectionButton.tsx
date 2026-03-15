"use client";

import { useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { GenerateCollectionModal } from "@/app/components/dashboard/collections/GenerateCollectionModal";

export const GenerateCollectionButton = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  return (
    <>
      <div className="fixed bottom-8 left-(--sidebar-w) right-0 flex justify-center pointer-events-none">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-full cursor-pointer pointer-events-auto overflow-hidden bg-linear-to-r from-cyan-500 via-sky-500 to-blue-600 bg-size-[200%_100%] bg-left shadow-lg shadow-sky-500/30 transition-all duration-500 hover:bg-right hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40"
        >
          <span className="absolute inset-0 bg-linear-to-r from-white/20 via-white/0 to-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <AutoAwesomeIcon sx={{ fontSize: 18 }}/>
          <span className="relative z-10">Generate Collection</span>
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