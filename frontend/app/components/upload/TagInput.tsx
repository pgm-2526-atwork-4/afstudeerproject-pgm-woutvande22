import { CloseOutlined } from "@mui/icons-material";

interface TagInputProps {
  tags: string[];
  onRemove?: (tag: string) => void;
  onAdd?: (tag: string) => void;
}

export const TagInput = ({ tags, onRemove, onAdd }: TagInputProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-sm font-medium text-gray-700">Tags</legend>

    {tags.length > 0 && (
      <ul className="flex flex-wrap gap-2" aria-label="Selected tags">
        {tags.map((tag) => (
          <li key={tag}>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {tag}
              <button
                type="button"
                onClick={() => onRemove?.(tag)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={`Remove ${tag}`}
              >
                <CloseOutlined sx={{ fontSize: 14 }} />
              </button>
            </span>
          </li>
        ))}
      </ul>
    )}

    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Add custom tag..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
        aria-label="Custom tag name"
      />
      <button
        type="button"
        onClick={() => onAdd?.("")}
        className="px-3 py-2 bg-sky-400 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
      >
        + Add
      </button>
    </div>
  </fieldset>
);
