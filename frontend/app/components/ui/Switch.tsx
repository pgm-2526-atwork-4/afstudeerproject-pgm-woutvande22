"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  ariaLabel?: string;
}

export const Switch = ({ checked, onChange, label, ariaLabel }: SwitchProps) => {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
        aria-label={ariaLabel || label}
      />
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-sky-400" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
      <span>{label}</span>
    </label>
  );
};