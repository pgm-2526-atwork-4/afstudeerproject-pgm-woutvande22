import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CollectionsIcon from "@mui/icons-material/Collections";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PaletteIcon from "@mui/icons-material/Palette";

const features = [
  {
    icon: CloudUploadIcon,
    title: "Smart Upload",
    description: "Upload images with AI-powered tag generation. Add them to existing collections or create new ones on the fly.",
  },
  {
    icon: CollectionsIcon,
    title: "Collections",
    description: "Organize your images into beautiful collections. Create, manage, and browse your visual library with ease.",
  },
  {
    icon: LocalOfferIcon,
    title: "Smart Tagging",
    description: "Manage tags with custom colors and names. Filter and search your entire collection using intelligent tagging.",
  },
  {
    icon: AutoAwesomeIcon,
    title: "AI Generation",
    description: "Generate entire collections with AI. Choose tags and prompts to create curated image sets automatically.",
  },
  {
    icon: PaletteIcon,
    title: "Moodboards",
    description: "Create stunning moodboards with drag-and-drop. Resize, arrange, and export your visual compositions.",
  },
];

export const Features = () => (
  <section className="flex justify-center px-6 py-20 bg-gray-50">
    <div className="w-full max-w-5xl">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Everything You Need to Manage Your Images
        </h2>
        <p className="text-gray-600 text-lg">
          Powerful features designed for creative workflows
        </p>
      </div>

      <div className="flex flex-wrap gap-6">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={feature.title}
              className="flex-1 min-w-80"
            >
              <div className="bg-white rounded-xl p-6 border border-gray-200 transition-colors h-full">
                <div className="text-4xl mb-4 text-[#39a2fa]">
                  <IconComponent sx={{ fontSize: 40 }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  </section>
);
