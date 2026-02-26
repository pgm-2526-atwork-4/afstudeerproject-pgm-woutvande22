import Link from "next/link";
import Image from "next/image";

interface ImageCardProps {
  id: string;
  label?: string;
  url?: string;
  tags?: string[];
  collectionId?: string;
}

export const ImageCard = ({ id, label, url, tags = [], collectionId }: ImageCardProps) => (
  <Link href={collectionId ? `/dashboard/${id}?collection=${collectionId}` : `/dashboard/${id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow block">
    <div className="aspect-4/3 relative bg-gray-100">
      {url ? (
        <Image
          src={url}
          alt={label || "Uploaded photo"}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="w-full h-full bg-gray-200" />
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-medium text-gray-900 truncate">{label || "Untitled"}</p>
      {tags.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  </Link>
);