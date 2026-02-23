interface ImageCardProps {
  label: string;
  color: string;
  tags: string[];
}

export const ImageCard = ({ label, color, tags }: ImageCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <div className={`${color} aspect-[4/3]`} />
    <div className="p-3">
      <p className="text-sm font-medium text-gray-900">{label}</p>
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
    </div>
  </div>
);