interface ImagePreviewThumbnailProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const ImagePreviewThumbnail = ({
  src,
  alt = "Upload preview",
  className = "",
}: ImagePreviewThumbnailProps) => (
  <figure className={`w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-900 ${className}`}>
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
