import { ImageCard } from "./ImageCard";

interface ImageItem {
  id: string;
  label: string;
  color: string;
  tags: string[];
}

interface ImageGridProps {
  images: ImageItem[];
}

export const ImageGrid = ({ images }: ImageGridProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
    {images.map((image) => (
      <ImageCard
        key={image.id}
        id={image.id}
        label={image.label}
        color={image.color}
        tags={image.tags}
      />
    ))}
  </div>
);