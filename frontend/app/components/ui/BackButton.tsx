"use client";

import Link from "next/link";
import { ArrowBackOutlined } from "@mui/icons-material";

interface BackButtonProps {
  href: string;
  label: string;
}

export const BackButton = ({ href, label }: BackButtonProps) => (
  <Link
    href={href}
    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
  >
    <ArrowBackOutlined sx={{ fontSize: 16 }} />
    {label}
  </Link>
);
