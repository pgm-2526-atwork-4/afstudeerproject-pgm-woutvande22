interface TagGenerationProgressProps {
  progress: number;
}

export const TagGenerationProgress = ({
  progress,
}: TagGenerationProgressProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">Generating tags...</span>
      <span className="text-xs text-gray-500">{progress}%</span>
    </div>
    <div
      className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Tag generation progress"
    >
      <div
        className="h-full rounded-full bg-sky-400 transition-[width] duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);
