import { InfoOutlined } from "@mui/icons-material";

interface StorageSectionProps {
  used?: number;
  total?: number;
}

export const StorageSection = ({
  used = 4.2,
  total = 10,
}: StorageSectionProps) => {
  const percent = (used / total) * 100;
  const remaining = total - used;

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white" aria-labelledby="storage-heading">
      <h2 id="storage-heading" className="text-xl font-bold text-gray-900 mb-5">
        Storage
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Storage Used</span>
          <span className="text-sm font-medium text-gray-700">
            {used} GB / {total} GB
          </span>
        </div>

        <div
          className="w-full h-2.5 bg-sky-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Storage: ${percent.toFixed(1)}% used`}
        >
          <div
            className="h-full bg-sky-400 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {percent.toFixed(1)}% used
          </span>
          <span className="text-xs text-gray-400">
            {remaining.toFixed(1)} GB remaining
          </span>
        </div>

        <aside className="mt-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <InfoOutlined className="text-sky-400 mt-0.5" sx={{ fontSize: 20 }} />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-900">Need more storage?</p>
              <p className="text-sm text-gray-500">
                Upgrade your plan to get more storage space for your image collections.
              </p>
              <button
                type="button"
                className="mt-2 self-start px-4 py-1.5 text-sm font-medium text-sky-500 bg-white border border-sky-300 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
