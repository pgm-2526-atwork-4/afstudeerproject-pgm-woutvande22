import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ title, description, action, className = "" }: EmptyStateProps) => (
  <div className={`flex min-h-[260px] items-center justify-center ${className}`}>
    <div className="max-w-md text-center">
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  </div>
);
