import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { UploadButton } from "@/app/components/dashboard/UploadButton";
import { SearchFilterBar } from "@/app/components/dashboard/SearchbarFilterBar";
import { ImageGrid } from "@/app/components/dashboard/ImageGrid";
import { GenerateCollectionButton } from "@/app/components/dashboard/GenerateCollectionButton";

const images = [
  { id: "serif-elegance", label: "Serif Elegance", color: "bg-[#1e3a30]", tags: ["typography", "branding"] },
  { id: "gradient-burst", label: "Gradient Burst", color: "bg-[#c5dff0]", tags: ["color", "ui"] },
  { id: "grid-system", label: "Grid System", color: "bg-[#d9a090]", tags: ["layout", "ui"] },
  { id: "brand-identity-kit", label: "Brand Identity Kit", color: "bg-[#c9a96e]", tags: ["branding", "color"] },
  { id: "ink-botanicals", label: "Ink Botanicals", color: "bg-[#1e3a30]", tags: ["illustration", "texture"] },
  { id: "desert-light", label: "Desert Light", color: "bg-[#8b7355]", tags: ["photography", "color"] },
  { id: "mono-type", label: "Mono Type", color: "bg-[#4a86b5]", tags: ["typography", "layout"] },
  { id: "woven-linen", label: "Woven Linen", color: "bg-[#5a5a52]", tags: ["texture", "color"] },
];

export default function DashboardPage() {
  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <PageHeader
            title="All Images"
            description="Browse and organize your design inspiration"
          />
          <UploadButton />
        </div>

        <SearchFilterBar />
      </div>

      <div className="px-8">
        <ImageGrid images={images} />
      </div>

      <GenerateCollectionButton />
    </div>
  );
}