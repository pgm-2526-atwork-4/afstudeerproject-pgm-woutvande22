"use client";

interface TagRowProps {
  name: string;
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}

export const TagRow = ({ name, color, onEdit, onDelete }: TagRowProps) => (
  <li className="flex items-center gap-4 px-5 py-3.5 bg-white rounded-xl border border-gray-200">
    <span
      className="w-8 h-8 rounded-md flex-shrink-0"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />

    <span
      className="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full"
    >
      {name}
    </span>

    <span className="text-sm text-gray-400">{color}</span>

    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="px-4 py-1.5 text-sm font-medium text-red-500 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
      >
        Delete
      </button>
    </div>
  </li>
);
