import { useRef } from "react";
import { FileUploadOutlined } from "@mui/icons-material";

interface FilePickerProps {
  fileName?: string;
  onFileSelect?: (file: File) => void;
  accept?: string;
}

export const FilePicker = ({
  fileName,
  onFileSelect,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: FilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect?.(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-label="Choose an image file"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <FileUploadOutlined sx={{ fontSize: 18 }} />
        {fileName ?? "Choose File"}
      </button>
    </div>
  );
};
