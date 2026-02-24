"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExpandMoreOutlined, ExpandLessOutlined } from "@mui/icons-material";

const collections = [
  { id: "brand-assets-2024", title: "Brand Assets 2024" },
  { id: "ui-inspiration", title: "UI Inspiration" },
  { id: "typography-studies", title: "Typography Studies" },
  { id: "color-palettes", title: "Color Palettes" },
  { id: "product-photography", title: "Product Photography" },
  { id: "illustrations", title: "Illustrations" },
];

interface CollectionDropdownProps {
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}

export const CollectionDropdown = ({ children, open, onToggle }: CollectionDropdownProps) => {
  const pathname = usePathname();

  return (
    <div>
      <div className="flex items-center">
        {children}

        <button
          type="button"
          onClick={onToggle}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={open ? "Collapse collections" : "Expand collections"}
        >
          {open ? (
            <ExpandLessOutlined sx={{ fontSize: 18 }} />
          ) : (
            <ExpandMoreOutlined sx={{ fontSize: 18 }} />
          )}
        </button>
      </div>

      {open && (
        <ul className="ml-9 mt-1 flex flex-col gap-0.5">
          {collections.map((col) => {
            const colHref = `/dashboard/collections/${col.id}`;
            const isActive = pathname === colHref;
            return (
              <li key={col.id}>
                <Link
                  href={colHref}
                  className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "text-sky-600 bg-sky-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {col.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
