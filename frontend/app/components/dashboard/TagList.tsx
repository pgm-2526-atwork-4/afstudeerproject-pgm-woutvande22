"use client";

interface TagListProps {
  tags: string[];
}

export const TagList = ({ tags }: TagListProps) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-sm font-medium text-gray-700">Tags</h3>

    <div className="flex gap-2 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag} tag`}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            &times;
          </button>
        </span>
      ))}
    </div>

    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Add custom tag..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
      />
      <button
        type="button"
        className="px-4 py-2 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
      >
        + Add
      </button>
    </div>
  </div>
);
