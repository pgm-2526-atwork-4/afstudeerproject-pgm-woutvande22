"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { 
  ImageOutlined, 
  FolderSpecialOutlined, 
  LocalOfferOutlined, 
  SettingsOutlined, 
  LogoutOutlined,
  ChevronLeftOutlined,
  ChevronRightOutlined,
} from "@mui/icons-material";

import { CollectionDropdown } from "@/app/components/dashboard/collections/CollectionDropdown";
import { useAuth } from "@/app/context/AuthContext";
import { fetchPhotos } from "@/app/lib/photos";
import { fetchCollections } from "@/app/lib/collections";
import { fetchTags } from "@/app/lib/tags";
import { COLLECTIONS_CHANGED } from "@/app/lib/events";

const navItems = [
  { label: "All Images", href: "/dashboard", icon: <ImageOutlined />, countKey: "photos" as const },
  { label: "Your Collections", href: "/dashboard/collections", icon: <FolderSpecialOutlined />, hasDropdown: true, countKey: "collections" as const },
  { label: "Tags", href: "/dashboard/tags", icon: <LocalOfferOutlined />, countKey: "tags" as const },
  { label: "Settings", href: "/dashboard/settings", icon: <SettingsOutlined /> },
];


export const Sidebar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const { logout } = useAuth();
  const [counts, setCounts] = useState<{ photos?: number; collections?: number; tags?: number }>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Re-fetch counts whenever collections change anywhere in the app
  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(COLLECTIONS_CHANGED, handler);
    return () => window.removeEventListener(COLLECTIONS_CHANGED, handler);
  }, []);

  // Fetch counts for sidebar badges
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    Promise.allSettled([
      fetchPhotos(token),
      fetchCollections(token),
      fetchTags(token),
    ]).then(([photosRes, colsRes, tagsRes]) => {
      setCounts({
        photos: photosRes.status === "fulfilled" ? photosRes.value.length : undefined,
        collections: colsRes.status === "fulfilled" ? colsRes.value.length : undefined,
        tags: tagsRes.status === "fulfilled" ? tagsRes.value.length : undefined,
      });
    });
  }, [refreshKey]);

  // Expose sidebar width as a CSS variable for fixed-position elements
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? "4rem" : "14rem"
    );
  }, [collapsed]);

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-56"
      } bg-white border-r border-gray-200 p-4 flex flex-col h-screen sticky top-0 transition-all duration-300`}
    >
      <div className={`mb-8 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-900">Collections</h1>
            <p className="text-xs text-gray-500">Organize your images</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRightOutlined /> : <ChevronLeftOutlined />}
        </button>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const count = item.countKey ? counts[item.countKey] : undefined;

          const link = (
            <Link
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-sky-50 text-sky-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && item.label}
              {!collapsed && count !== undefined && (
                <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-sky-100 text-sky-600" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </Link>
          );

          if (item.hasDropdown && !collapsed) {
            return (
              <CollectionDropdown
                key={item.href}
                open={collectionsOpen}
                onToggle={() => setCollectionsOpen((o) => !o)}
              >
                {link}
              </CollectionDropdown>
            );
          }

          return (
            <div key={item.href}>
              <div className="flex items-center">
                {link}
              </div>
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        title={collapsed ? "Logout" : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <span className="text-xl"><LogoutOutlined /></span>
        {!collapsed && "Logout"}
      </button>
    </aside>
  );
};