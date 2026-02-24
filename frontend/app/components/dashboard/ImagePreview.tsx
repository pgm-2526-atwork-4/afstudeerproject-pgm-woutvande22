import Link from "next/link";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ImagePreviewProps {
  color: string;
  alt: string;
  prevHref?: string;
  nextHref?: string;
}

export const ImagePreview = ({ color, alt, prevHref, nextHref }: ImagePreviewProps) => (
  <figure className="w-full lg:w-1/2 flex-shrink-0 relative group">
    <div
      className="rounded-xl w-full aspect-[4/3]"
      style={{ backgroundColor: color }}
      role="img"
      aria-label={alt}
    />

    {prevHref && (
      <Link
        href={prevHref}
        className="absolute left-2 top-1/2 -translate-y-1/2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
        aria-label="Previous image"
      >
        <ChevronLeftIcon className="text-white" sx={{ fontSize: 48 }} />
      </Link>
    )}

    {nextHref && (
      <Link
        href={nextHref}
        className="absolute right-2 top-1/2 -translate-y-1/2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
        aria-label="Next image"
      >
        <ChevronRightIcon className="text-white" sx={{ fontSize: 48 }} />
      </Link>
    )}
  </figure>
);
