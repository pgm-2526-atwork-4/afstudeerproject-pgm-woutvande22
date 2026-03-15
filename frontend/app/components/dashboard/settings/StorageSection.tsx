import { InfoOutlined } from "@mui/icons-material";

interface StorageSectionProps {
  usedMb?: number;
  totalMb?: number;
}

const formatStorageAmount = (megabytes: number) => {
  if (megabytes >= 1024) {
    return `${(megabytes / 1024).toFixed(1)} GB`;
  }

  return `${megabytes.toFixed(1)} MB`;
};

export const StorageSection = ({
  usedMb = 0,
  totalMb = 10240,
}: StorageSectionProps) => {
  const safeTotalMb = totalMb > 0 ? totalMb : 10240;
  const percent = Math.min((usedMb / safeTotalMb) * 100, 100);
  const remainingMb = Math.max(safeTotalMb - usedMb, 0);

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white" aria-labelledby="storage-heading">
      <h2 id="storage-heading" className="text-xl font-bold text-gray-900 mb-5">
        Storage
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Storage Used</span>
          <span className="text-sm font-medium text-gray-700">
            {formatStorageAmount(usedMb)} / {formatStorageAmount(safeTotalMb)}
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
            {formatStorageAmount(remainingMb)} remaining
          </span>
        </div>

      </div>
    </section>
  );
};
