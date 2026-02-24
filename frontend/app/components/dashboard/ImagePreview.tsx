interface ImagePreviewProps {
  color: string;
  alt: string;
}

export const ImagePreview = ({ color, alt }: ImagePreviewProps) => (
  <figure className="flex-shrink-0">
    <div
      className={`${color} rounded-xl w-full max-w-lg aspect-[4/3]`}
      role="img"
      aria-label={alt}
    />
  </figure>
);
