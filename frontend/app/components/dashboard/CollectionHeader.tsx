import Link from "next/link";
import { ContentCopyOutlined, FavoriteBorderOutlined } from "@mui/icons-material";

interface CollectionHeaderProps {
  title: string;
  description: string;
  imageCount: number;
  color: string;
}

export const CollectionHeader = ({
  title,
  description,
  imageCount,
  color,
}: CollectionHeaderProps) => (
  <div>
    <Link
      href="/dashboard/collections"
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
    >
      ← Back to Collections
    </Link>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center gap-1 text-white/60">
            <ContentCopyOutlined fontSize="medium" />
            <FavoriteBorderOutlined fontSize="small" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <p className="text-xs text-gray-400 mt-1">{imageCount} Images</p>
        </div>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
        Create Moodboard
      </button>
    </div>
  </div>
);
