import { CollectionDetailContent } from "./CollectionDetailContent";

const collections: Record<string, { title: string; description: string; imageCount: number; color: string }> = {
  "brand-assets-2024": { title: "Brand Assets 2024", description: "Logo designs and brand identity", imageCount: 24, color: "#4a86b5" },
  "ui-inspiration": { title: "UI Inspiration", description: "Modern interface designs", imageCount: 18, color: "#c5dff0" },
  "typography-studies": { title: "Typography Studies", description: "Experimental type work", imageCount: 32, color: "#1e3a30" },
  "color-palettes": { title: "Color Palettes", description: "Curated color combinations", imageCount: 15, color: "#c9a96e" },
  "product-photography": { title: "Product Photography", description: "E-commerce product shots", imageCount: 28, color: "#8b7355" },
  "illustrations": { title: "Illustrations", description: "Hand-drawn and digital art", imageCount: 42, color: "#1e3a30" },
};

const collectionImages: Record<string, { id: string; label: string; color: string; tags: string[] }[]> = {
  "brand-assets-2024": [
    { id: "serif-elegance", label: "Serif Elegance", color: "bg-[#1e3a30]", tags: ["typography", "branding"] },
    { id: "gradient-burst", label: "Gradient Burst", color: "bg-[#c5dff0]", tags: ["color", "ui"] },
    { id: "grid-system", label: "Grid System", color: "bg-[#d9a090]", tags: ["layout", "ui"] },
    { id: "brand-identity-kit", label: "Brand Identity Kit", color: "bg-[#c9a96e]", tags: ["branding", "color"] },
    { id: "ink-botanicals", label: "Ink Botanicals", color: "bg-[#1e3a30]", tags: ["illustration", "texture"] },
    { id: "desert-light", label: "Desert Light", color: "bg-[#8b7355]", tags: ["photography", "color"] },
    { id: "mono-type", label: "Mono Type", color: "bg-[#4a86b5]", tags: ["typography", "layout"] },
    { id: "woven-linen", label: "Woven Linen", color: "bg-[#5a5a52]", tags: ["texture", "color"] },
    { id: "dashboard-ui", label: "Dashboard UI", color: "bg-[#1a1a1a]", tags: ["ui", "layout"] },
    { id: "brush-strokes", label: "Brush Strokes", color: "bg-[#1e3a30]", tags: ["illustration", "texture"] },
    { id: "bold-architecture", label: "Bold Architecture", color: "bg-[#c94040]", tags: ["color", "branding"] },
    { id: "editorial-spread", label: "Editorial Spread", color: "bg-[#7a9ab5]", tags: ["layout", "typography"] },
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
