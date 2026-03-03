import Link from "next/link";
import {
  FavoriteBorderOutlined,
  ContentCopyOutlined,
  PushPinOutlined,
  PushPin,
} from "@mui/icons-material";

interface CollectionCardProps {
  id: string;
  title: string;
  description: string;
  imageCount: number;
  color: string;
  pinned?: boolean;
  onTogglePin?: (id: string) => void;
}

export const CollectionCard = ({
  id,
  title,
  description,
  imageCount,
  color,
  pinned = false,
  onTogglePin,
}: CollectionCardProps) => (
  <Link href={`/dashboard/collections/${id}`} className="block">
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
      <div
        className="aspect-[16/9] flex items-center justify-center relative"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-1 text-white/60">
          <ContentCopyOutlined fontSize="large" />
          <FavoriteBorderOutlined fontSize="medium" />
        </div>

        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin(id);
            }}
            className={`absolute top-2 right-2 p-1 rounded-full transition-colors cursor-pointer ${
              pinned
                ? "bg-white text-sky-500 shadow-sm"
                : "bg-black/20 text-white/70 hover:bg-black/40 hover:text-white"
            }`}
            title={pinned ? "Unpin collection" : "Pin collection"}
          >
            {pinned ? (
              <PushPin fontSize="small" />
            ) : (
              <PushPinOutlined fontSize="small" />
            )}
          </button>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{description}</p>
        <p className="text-[10px] text-gray-400 mt-1.5">{imageCount} Images</p>
      </div>
    </article>
  </Link>
);
