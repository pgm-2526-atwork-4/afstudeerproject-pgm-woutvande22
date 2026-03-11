"use client";

import { useState } from "react";

interface TagFormProps {
  initialName?: string;
  initialColor?: string;
  onSave: (name: string, color: string) => void | Promise<void>;
  onCancel: () => void;
}

export const TagForm = ({
  initialName = "",
  initialColor = "#ffffff",
  onSave,
  onCancel,
}: TagFormProps) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await onSave(name.trim().toLowerCase(), color);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tag");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-4 px-5 py-3.5 bg-white rounded-xl border border-gray-200"
      >
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Color:
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded-md border border-gray-300 cursor-pointer p-0"
        />
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tag name…"
        autoFocus
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
      />

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-semibold text-white bg-sky-400 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
      </form>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
};
