"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ImagePreviewProps {
  url?: string;
  alt: string;
  onPrev?: () => void;
  onNext?: () => void;
}

export const ImagePreview = ({ url, alt, onPrev, onNext }: ImagePreviewProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset loading state when the URL changes
  useEffect(() => {
    setImageLoaded(false);
  }, [url]);

  return (
    <figure className="w-full lg:w-1/2 shrink-0 relative group">
      <div className="rounded-xl w-full aspect-4/3 relative overflow-hidden bg-gray-100">
        {url ? (
          <>
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 animate-pulse">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
              </div>
            )}
            <Image
              src={url}
              alt={alt}
              fill
              unoptimized
              priority
              className={`object-contain transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              sizes="(max-width: 1024px) 100vw, 50vw"
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gray-200" role="img" aria-label={alt} />
        )}
      </div>

      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="text-white" sx={{ fontSize: 48 }} />
        </button>
      )}

      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Next image"
        >
          <ChevronRightIcon className="text-white" sx={{ fontSize: 48 }} />
        </button>
      )}
    </figure>
  );
};
