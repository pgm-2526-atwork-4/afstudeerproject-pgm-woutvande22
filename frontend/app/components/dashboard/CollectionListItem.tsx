import Link from "next/link";
import {
  ContentCopyOutlined,
  PushPinOutlined,
  PushPin,
} from "@mui/icons-material";

interface CollectionListItemProps {
  id: string;
  title: string;
  description: string;
  imageCount: number;
  color: string;
  pinned?: boolean;
  onTogglePin?: (id: string) => void;
}

export const CollectionListItem = ({
  id,
  title,
  description,
  imageCount,
  color,
  pinned = false,
  onTogglePin,
}: CollectionListItemProps) => (
  <Link href={`/dashboard/collections/${id}`} className="block">
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 pr-4">
      <div
        className="w-20 h-16 shrink-0 flex items-center justify-center rounded-l-xl"
        style={{ backgroundColor: color }}
      >
        <ContentCopyOutlined fontSize="small" className="text-white/60" />
      </div>

      <div className="flex-1 min-w-0 py-2">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
        )}
      </div>

      <span className="text-xs text-gray-400 shrink-0">
        {imageCount} {imageCount === 1 ? "Image" : "Images"}
      </span>

      {onTogglePin && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin(id);
          }}
          className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
            pinned
              ? "text-sky-500 bg-sky-50"
              : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
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
    </article>
  </Link>
);
