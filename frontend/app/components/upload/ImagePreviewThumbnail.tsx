interface ImagePreviewThumbnailProps {
  src?: string;
  alt?: string;
}

export const ImagePreviewThumbnail = ({
  src,
  alt = "Upload preview",
}: ImagePreviewThumbnailProps) => (
  <figure className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-900">
    {src ? (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
      />
    ) : (
      <div className="w-full h-full" />
    )}
  </figure>
);
