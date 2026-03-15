import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  CheckCircleOutlined,
} from "@mui/icons-material";
import { ImagePreviewThumbnail } from "./ImagePreviewThumbnail";
import { LoadingCircle } from "@/app/components/ui/LoadingCircle";

interface UploadPreviewItem {
  id: string;
  title: string;
  fileName: string;
  previewUrl: string;
  aiLoading: boolean;
  tagCount: number;
}

interface UploadPreviewCarouselProps {
  items: UploadPreviewItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const UploadPreviewCarousel = ({
  items,
  activeId,
  onSelect,
  onPrev,
  onNext,
}: UploadPreviewCarouselProps) => {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );
  const activeItem = items[activeIndex] ?? null;

  if (!activeItem) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
        <ImagePreviewThumbnail
          src={activeItem.previewUrl}
          alt={activeItem.fileName}
          className="max-h-72"
        />

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm transition-colors hover:bg-white hover:text-gray-800 cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeftOutlined sx={{ fontSize: 20 }} />
            </button>

            <button
              type="button"
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-600 shadow-sm transition-colors hover:bg-white hover:text-gray-800 cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRightOutlined sx={{ fontSize: 20 }} />
            </button>
          </>
        )}

        <div className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-1 text-xs font-medium text-white">
          {activeIndex + 1} / {items.length}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
        <p className="truncate text-sm font-semibold text-gray-800">
          {activeItem.title || activeItem.fileName}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
          {activeItem.aiLoading && (
            <LoadingCircle size="sm" className="text-sky-500" label="Analyzing image" />
          )}
          {!activeItem.aiLoading && (
            <CheckCircleOutlined sx={{ fontSize: 14 }} className="text-emerald-600" />
          )}
          <span>
            {activeItem.aiLoading
              ? "Analyzing..."
              : `${activeItem.tagCount} tag${activeItem.tagCount === 1 ? "" : "s"}`}
          </span>
        </p>
      </div>

      {items.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {items.map((item) => {
            const selected = item.id === activeItem.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                  selected
                    ? "border-sky-400 ring-2 ring-sky-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                aria-label={`Select ${item.fileName}`}
              >
                <div className="relative">
                  <ImagePreviewThumbnail
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="h-20 w-28 aspect-auto"
                  />
                  {!item.aiLoading && (
                    <span className="absolute right-1.5 top-1.5 inline-flex items-center rounded-full bg-emerald-600/95 p-0.5 text-white">
                      <CheckCircleOutlined sx={{ fontSize: 12 }} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};