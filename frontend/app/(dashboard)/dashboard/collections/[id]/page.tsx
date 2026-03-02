import { CollectionDetailContent } from "./CollectionDetailContent";

const collections: Record<string, { title: string; description: string; imageCount: number; color: string }> = {
  "brand-assets-2024": { title: "Brand Assets 2024", description: "Logo designs and brand identity", imageCount: 24, color: "#4a86b5" },
  "ui-inspiration": { title: "UI Inspiration", description: "Modern interface designs", imageCount: 18, color: "#c5dff0" },
  "typography-studies": { title: "Typography Studies", description: "Experimental type work", imageCount: 32, color: "#1e3a30" },
  "color-palettes": { title: "Color Palettes", description: "Curated color combinations", imageCount: 15, color: "#c9a96e" },
  "product-photography": { title: "Product Photography", description: "E-commerce product shots", imageCount: 28, color: "#8b7355" },
  "illustrations": { title: "Illustrations", description: "Hand-drawn and digital art", imageCount: 42, color: "#1e3a30" },
};

import type { ImageTag } from "@/app/components/dashboard/ImageGrid";

const collectionImages: Record<string, { id: string; label: string; tags: ImageTag[] }[]> = {
  "brand-assets-2024": [
    { id: "serif-elegance", label: "Serif Elegance", tags: [{ name: "typography", color_hex: "#4a86b5" }, { name: "branding", color_hex: "#1e3a30" }] },
    { id: "gradient-burst", label: "Gradient Burst", tags: [{ name: "color", color_hex: "#c5dff0" }, { name: "ui", color_hex: "#d9a090" }] },
    { id: "grid-system", label: "Grid System", tags: [{ name: "layout", color_hex: "#c9a96e" }, { name: "ui", color_hex: "#d9a090" }] },
    { id: "brand-identity-kit", label: "Brand Identity Kit", tags: [{ name: "branding", color_hex: "#1e3a30" }, { name: "color", color_hex: "#c5dff0" }] },
    { id: "ink-botanicals", label: "Ink Botanicals", tags: [{ name: "illustration", color_hex: "#8b7355" }, { name: "texture", color_hex: "#5a5a52" }] },
    { id: "desert-light", label: "Desert Light", tags: [{ name: "photography", color_hex: "#c94040" }, { name: "color", color_hex: "#c5dff0" }] },
    { id: "mono-type", label: "Mono Type", tags: [{ name: "typography", color_hex: "#4a86b5" }, { name: "layout", color_hex: "#c9a96e" }] },
    { id: "woven-linen", label: "Woven Linen", tags: [{ name: "texture", color_hex: "#5a5a52" }, { name: "color", color_hex: "#c5dff0" }] },
    { id: "dashboard-ui", label: "Dashboard UI", tags: [{ name: "ui", color_hex: "#d9a090" }, { name: "layout", color_hex: "#c9a96e" }] },
    { id: "brush-strokes", label: "Brush Strokes", tags: [{ name: "illustration", color_hex: "#8b7355" }, { name: "texture", color_hex: "#5a5a52" }] },
    { id: "bold-architecture", label: "Bold Architecture", tags: [{ name: "color", color_hex: "#c5dff0" }, { name: "branding", color_hex: "#1e3a30" }] },
    { id: "editorial-spread", label: "Editorial Spread", tags: [{ name: "layout", color_hex: "#c9a96e" }, { name: "typography", color_hex: "#4a86b5" }] },
  ],
};

interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = await params;
  const collection = collections[id];

  if (!collection) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Collection not found.</p>
      </div>
    );
  }

  const images = collectionImages[id] ?? [];

  return (
    <CollectionDetailContent
      collection={collection}
      images={images}
      collectionId={id}
    />
  );
}
