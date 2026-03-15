import { LoadingCircle } from "@/app/components/ui/LoadingCircle";

interface UploadAnalysisProgressBarProps {
  analyzedCount: number;
  totalCount: number;
}

export const UploadAnalysisProgressBar = ({
  analyzedCount,
  totalCount,
}: UploadAnalysisProgressBarProps) => {
  const safeTotal = Math.max(totalCount, 1);
  const percent = Math.min(100, Math.round((analyzedCount / safeTotal) * 100));
  const allAnalyzed = analyzedCount >= totalCount && totalCount > 0;

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {!allAnalyzed && (
            <LoadingCircle
              size="sm"
              className="text-sky-500"
              label="Analyzing uploaded images"
            />
          )}
          <span>{allAnalyzed ? "Analysis complete" : "Analyzing images"}</span>
        </div>
        <p className="text-xs font-semibold text-gray-500">
          {analyzedCount}/{totalCount} analyzed
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-sky-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
};