import Link from "next/link";
import Image from "next/image";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ImagePreviewProps {
  url?: string;
  alt: string;
  prevHref?: string;
  nextHref?: string;
}

export const ImagePreview = ({ url, alt, prevHref, nextHref }: ImagePreviewProps) => (
  <figure className="w-full lg:w-1/2 shrink-0 relative group">
    <div className="rounded-xl w-full aspect-4/3 relative overflow-hidden bg-gray-100">
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      ) : (
        <div className="w-full h-full bg-gray-200" role="img" aria-label={alt} />
      )}
    </div>

    {prevHref && (
      <Link
        href={prevHref}
        className="absolute left-2 top-1/2 -translate-y-1/2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous image"
      >
        <ChevronLeftIcon className="text-white" sx={{ fontSize: 48 }} />
      </Link>
    )}

    {nextHref && (
      <Link
        href={nextHref}
        className="absolute right-2 top-1/2 -translate-y-1/2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next image"
      >
        <ChevronRightIcon className="text-white" sx={{ fontSize: 48 }} />
      </Link>
    )}
  </figure>
);
