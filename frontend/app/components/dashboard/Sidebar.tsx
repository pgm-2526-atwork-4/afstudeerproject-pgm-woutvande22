"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { 
  ImageOutlined, 
  FolderSpecialOutlined, 
  LocalOfferOutlined, 
  SettingsOutlined, 
  LogoutOutlined 
} from "@mui/icons-material";

const navItems = [
  { label: "All Images", href: "/dashboard", icon: <ImageOutlined /> },
  { label: "Your Collections", href: "/dashboard/collections", icon: <FolderSpecialOutlined /> },
  { label: "Tags", href: "/dashboard/tags", icon: <LocalOfferOutlined /> },
  { label: "Settings", href: "/dashboard/settings", icon: <SettingsOutlined /> },
  { label: "Logout", href: "/", icon: <LogoutOutlined /> },
];


export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-gray-900">Collections</h1>
        <p className="text-xs text-gray-500">Organize your images</p>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sky-50 text-sky-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};