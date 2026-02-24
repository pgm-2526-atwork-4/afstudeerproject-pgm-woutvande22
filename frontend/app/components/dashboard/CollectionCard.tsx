import { FavoriteBorderOutlined, ContentCopyOutlined } from "@mui/icons-material";

interface CollectionCardProps {
  id: string;
  title: string;
  description: string;
  imageCount: number;
  color: string;
}

export const CollectionCard = ({
  title,
  description,
  imageCount,
  color,
}: CollectionCardProps) => (
  <article className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div
      className="aspect-[16/9] flex items-center justify-center"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center gap-1 text-white/60">
        <ContentCopyOutlined fontSize="large" />
        <FavoriteBorderOutlined fontSize="medium" />
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      <p className="text-xs text-gray-400 mt-2">{imageCount} Images</p>
    </div>
  </article>
);
