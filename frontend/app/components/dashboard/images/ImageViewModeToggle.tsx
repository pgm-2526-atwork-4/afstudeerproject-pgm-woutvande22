import {
  DashboardOutlined,
  GridViewOutlined,
  ViewListOutlined,
} from "@mui/icons-material";

export type ImageViewMode = "cards" | "grid" | "list";

interface ImageViewModeToggleProps {
  mode: ImageViewMode;
  onChange: (mode: ImageViewMode) => void;
}

const options: Array<{
  value: ImageViewMode;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "cards",
    label: "Cards",
    icon: <GridViewOutlined sx={{ fontSize: 18 }} />,
  },
  {
    value: "grid",
    label: "Grid",
    icon: <DashboardOutlined sx={{ fontSize: 18 }} />,
  },
  {
    value: "list",
    label: "List",
    icon: <ViewListOutlined sx={{ fontSize: 18 }} />,
  },
];

export const ImageViewModeToggle = ({ mode, onChange }: ImageViewModeToggleProps) => (
  <div
    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-1 py-1"
    role="tablist"
    aria-label="Image view mode"
  >
    {options.map((option) => {
      const active = option.value === mode;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex h-8.5 w-8.5 items-center justify-center rounded-md transition-colors cursor-pointer ${
            active
              ? "bg-sky-100 text-sky-700"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          }`}
          role="tab"
          aria-selected={active}
          aria-label={option.label}
          title={option.label}
        >
          {option.icon}
        </button>
      );
    })}
  </div>
);