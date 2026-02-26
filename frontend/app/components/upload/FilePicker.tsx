import { FileUploadOutlined } from "@mui/icons-material";

interface FilePickerProps {
  fileName?: string;
}

export const FilePicker = ({ fileName }: FilePickerProps) => (
  <div className="flex flex-col gap-3">
    <button
      type="button"
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <FileUploadOutlined sx={{ fontSize: 18 }} />
      {fileName ?? "Choose File"}
    </button>
  </div>
);
