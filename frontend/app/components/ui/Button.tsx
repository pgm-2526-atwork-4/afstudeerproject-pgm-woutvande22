import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button = ({ children, className = "", ...props }: ButtonProps) => (
  <button
    className={`w-full py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer ${className}`}
    {...props}
  >
    {children}
  </button>
);
