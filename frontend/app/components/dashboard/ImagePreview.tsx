interface ImagePreviewProps {
  color: string;
  alt: string;
}

export const ImagePreview = ({ color, alt }: ImagePreviewProps) => (
  <figure className="w-full lg:w-1/2 flex-shrink-0">
    <div
      className="rounded-xl w-full aspect-[4/3]"
      style={{ backgroundColor: color }}
      role="img"
      aria-label={alt}
    />
  </figure>
);
