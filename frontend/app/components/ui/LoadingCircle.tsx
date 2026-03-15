interface LoadingCircleProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses: Record<NonNullable<LoadingCircleProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-[3px]",
};

export const LoadingCircle = ({ size = "md", className = "", label = "Loading" }: LoadingCircleProps) => (
  <span
    role="status"
    aria-label={label}
    className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClasses[size]} ${className}`}
  />
);