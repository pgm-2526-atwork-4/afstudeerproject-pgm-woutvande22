"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExpandMoreOutlined, ExpandLessOutlined } from "@mui/icons-material";
import { fetchCollections, type Collection } from "@/app/lib/collections";

interface CollectionDropdownProps {
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}

export const CollectionDropdown = ({ children, open, onToggle }: CollectionDropdownProps) => {
  const pathname = usePathname();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const cols = await fetchCollections(token);
        setCollections(cols);
      } catch (err) {
        console.error("Failed to load collections:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

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
          {loading ? (
            <li className="px-3 py-1.5 text-xs text-gray-400">Loading…</li>
          ) : collections.length === 0 ? (
            <li className="px-3 py-1.5 text-xs text-gray-400">No collections</li>
          ) : (
            collections.map((col) => {
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
            })
          )}
        </ul>
      )}
    </div>
  );
};
