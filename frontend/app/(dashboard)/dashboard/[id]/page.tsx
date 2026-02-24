import Link from "next/link";
import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { ImagePreview } from "@/app/components/dashboard/ImagePreview";
import { ImageDetailsForm } from "@/app/components/dashboard/ImageDetailsForm";

// Static data — will be replaced with real fetching later
const images: Record<string, { label: string; color: string; size: string; tags: string[] }> = {
  "serif-elegance": { label: "Serif Elegance", color: "#1e3a30", size: "1920×1080", tags: ["typography", "branding"] },
  "gradient-burst": { label: "Gradient Burst", color: "#c5dff0", size: "1920×1080", tags: ["color", "ui"] },
  "grid-system": { label: "Grid System", color: "#d9a090", size: "1920×1080", tags: ["layout", "ui"] },
  "brand-identity-kit": { label: "Brand Identity Kit", color: "#c9a96e", size: "1920×1080", tags: ["branding", "color"] },
  "ink-botanicals": { label: "Ink Botanicals", color: "#1e3a30", size: "1920×1080", tags: ["illustration", "texture"] },
  "desert-light": { label: "Desert Light", color: "#8b7355", size: "1920×1080", tags: ["photography", "color"] },
  "mono-type": { label: "Mono Type", color: "#4a86b5", size: "1920×1080", tags: ["typography", "layout"] },
  "woven-linen": { label: "Woven Linen", color: "#5a5a52", size: "1920×1080", tags: ["texture", "color"] },
};

interface ImageDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ collection?: string }>;
}

export default async function ImageDetailPage({ params, searchParams }: ImageDetailPageProps) {
  const { id } = await params;
  const { collection } = await searchParams;
  const image = images[id];

  if (!image) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Image not found.</p>
        <Link href="/dashboard" className="text-sky-500 hover:text-sky-600 text-sm mt-2 inline-block">
          ← Back to All Images
        </Link>
      </div>
    );
  }

  return (
    <article className="p-8">
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Image Details"
          description="Edit and manage your image details"
        />
        <Link
          href={collection ? `/dashboard/collections/${collection}` : "/dashboard"}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {collection ? "← Back to Collection" : "← Back to All Images"}
        </Link>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        <ImagePreview color={image.color} alt={image.label} />

        <div className="flex-1">
          <ImageDetailsForm
            title={image.label}
            size={image.size}
            tags={image.tags}
          />
        </div>
      </div>
    </article>
  );
}
