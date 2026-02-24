"use client";

import { useState } from "react";
import { VisibilityOutlined, VisibilityOffOutlined } from "@mui/icons-material";

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
}

export const PasswordInput = ({
  id,
  label,
  placeholder,
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {visible ? (
            <VisibilityOffOutlined sx={{ fontSize: 20 }} />
          ) : (
            <VisibilityOutlined sx={{ fontSize: 20 }} />
          )}
        </button>
      </div>
    </div>
  );
};
