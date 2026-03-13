"use client";

import type { ReactNode } from "react";
import { KeyboardArrowDownOutlined } from "@mui/icons-material";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  ariaLabel?: string;
  icon?: ReactNode;
}

export const FilterSelect = ({ value, onChange, options, ariaLabel, icon }: FilterSelectProps) => {
  return (
    <div className="relative min-w-44">
      {icon && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className={`w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pr-10 text-sm text-gray-700 shadow-sm transition-colors focus:border-transparent focus:ring-2 focus:ring-sky-400 ${icon ? "pl-10" : "pl-4"}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <KeyboardArrowDownOutlined className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" sx={{ fontSize: 18 }} />
    </div>
  );
};