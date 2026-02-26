interface CollectionPickerProps {
  collections: { id: string; title: string }[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  showCreateForm?: boolean;
  onToggleCreateForm?: () => void;
}

export const CollectionPicker = ({
  collections,
  selectedId,
  showCreateForm = false,
  onSelect,
  onToggleCreateForm,
}: CollectionPickerProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-sm font-medium text-gray-700">Collection</legend>

    <select
      value={selectedId ?? ""}
      onChange={(e) => onSelect?.(e.target.value)}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow cursor-pointer appearance-none"
      aria-label="Select a collection"
    >
      <option value="">Select a collection...</option>
      {collections.map((col) => (
        <option key={col.id} value={col.id}>
          {col.title}
        </option>
      ))}
    </select>

    {!showCreateForm ? (
      <button
        type="button"
        onClick={onToggleCreateForm}
        className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        + Create New Collection
      </button>
    ) : (
      <div className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
        <input
          type="text"
          placeholder="Collection name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
          aria-label="New collection name"
        />
        <input
          type="text"
          placeholder="Description (optional)..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
          aria-label="New collection description"
        />
        <button
          type="button"
          onClick={onToggleCreateForm}
          className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Cancel New Collection
        </button>
      </div>
    )}
  </fieldset>
);
