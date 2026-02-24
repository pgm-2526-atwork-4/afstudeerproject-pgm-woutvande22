import { FileUploadOutlined } from "@mui/icons-material";

export const UploadButton = () => (
  <button
    type="button"
    className="flex items-center gap-2 px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
  >
    <FileUploadOutlined sx={{ fontSize: 16 }} />
    Upload Image
  </button>
);