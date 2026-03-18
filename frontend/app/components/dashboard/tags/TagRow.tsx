"use client";

interface TagRowProps {
  id?: string;
  name: string;
  color: string;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const TagRow = ({ id, name, color, selected = false, onToggleSelect, onEdit, onDelete }: TagRowProps) => (
  <li className="flex items-center gap-4 px-5 py-3.5 bg-white rounded-xl border border-gray-200">
    {id && onToggleSelect && (
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(id)}
        className="h-4 w-4 rounded border-gray-300 text-sky-500 focus:ring-sky-400"
        aria-label={`Select ${name}`}
      />
    )}

    <span
      className="w-8 h-8 rounded-md shrink-0"
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
