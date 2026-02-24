import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { CollectionSearchBar } from "@/app/components/dashboard/CollectionSearchBar";
import { CollectionGrid } from "@/app/components/dashboard/CollectionGrid";
import { GenerateCollectionButton } from "@/app/components/dashboard/GenerateCollectionButton";

const collections = [
  { id: "brand-assets-2024", title: "Brand Assets 2024", description: "Logo designs and brand identity", imageCount: 24, color: "#4a86b5" },
  { id: "ui-inspiration", title: "UI Inspiration", description: "Modern interface designs", imageCount: 18, color: "#c5dff0" },
  { id: "typography-studies", title: "Typography Studies", description: "Experimental type work", imageCount: 32, color: "#1e3a30" },
  { id: "color-palettes", title: "Color Palettes", description: "Curated color combinations", imageCount: 15, color: "#c9a96e" },
  { id: "product-photography", title: "Product Photography", description: "E-commerce product shots", imageCount: 28, color: "#8b7355" },
  { id: "illustrations", title: "Illustrations", description: "Hand-drawn and digital art", imageCount: 42, color: "#1e3a30" },
];

export default function CollectionsPage() {
  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 px-8 pt-8 pb-4 bg-gray-50/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Your Collections"
            description="Manage and organize your image collections"
          />
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            + Create Collection
          </button>
        </div>

        <CollectionSearchBar />
      </div>

      <div className="px-8">
        <CollectionGrid collections={collections} />
      </div>

      <GenerateCollectionButton />
    </div>
  );
}
