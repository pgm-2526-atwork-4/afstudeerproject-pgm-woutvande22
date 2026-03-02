import { DeleteOutline } from "@mui/icons-material";

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export const DeleteButton = ({ onClick }: DeleteButtonProps) => (
  <button
    onClick={onClick}
    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
    aria-label="Delete image"
  >
    <DeleteOutline className="text-gray-600 hover:text-red-600" sx={{ fontSize: 20 }} />
  </button>
);
