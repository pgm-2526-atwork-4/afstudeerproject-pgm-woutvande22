import { DeleteOutline } from "@mui/icons-material";

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export const DeleteButton = ({ onClick }: DeleteButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/88 text-slate-600 shadow-lg shadow-slate-900/10 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-red-50 hover:text-red-600 cursor-pointer"
    aria-label="Delete image"
  >
    <DeleteOutline sx={{ fontSize: 18 }} />
  </button>
);
