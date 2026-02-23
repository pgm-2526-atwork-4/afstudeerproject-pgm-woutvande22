import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { UploadButton } from "@/app/components/dashboard/UploadButton";
import { SearchFilterBar } from "@/app/components/dashboard/SearchbarFilterBar";
import { ImageGrid } from "@/app/components/dashboard/ImageGrid";
import { GenerateCollectionButton } from "@/app/components/dashboard/GenerateCollectionButton";

const images = [
  { label: "Serif Elegance", color: "bg-[#1e3a30]", tags: ["typography", "branding"] },
  { label: "Gradient Burst", color: "bg-[#c5dff0]", tags: ["color", "ui"] },
  { label: "Grid System", color: "bg-[#d9a090]", tags: ["layout", "ui"] },
  { label: "Brand Identity Kit", color: "bg-[#c9a96e]", tags: ["branding", "color"] },
  { label: "Ink Botanicals", color: "bg-[#1e3a30]", tags: ["illustration", "texture"] },
  { label: "Desert Light", color: "bg-[#8b7355]", tags: ["photography", "color"] },
  { label: "Mono Type", color: "bg-[#4a86b5]", tags: ["typography", "layout"] },
  { label: "Woven Linen", color: "bg-[#5a5a52]", tags: ["texture", "color"] },
];

export default function DashboardPage() {
  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 -mx-8 px-8 pt-8 pb-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <PageHeader
            title="All Images"
            description="Browse and organize your design inspiration"
          />
          <UploadButton />
        </div>

        <SearchFilterBar />
      </div>

      <ImageGrid images={images} />

      <GenerateCollectionButton />
    </div>
  );
}