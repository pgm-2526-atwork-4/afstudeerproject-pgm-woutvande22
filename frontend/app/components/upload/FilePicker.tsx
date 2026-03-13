import { useState, useRef } from "react";
import { FileUploadOutlined, ImageOutlined } from "@mui/icons-material";

interface FilePickerProps {
  fileNames?: string[];
  onFileSelect?: (files: File[]) => void;
  accept?: string;
}

export const FilePicker = ({
  fileNames = [],
  onFileSelect,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: FilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasFiles = fileNames.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFileSelect?.(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      onFileSelect?.(files);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        className="hidden"
        aria-label="Choose image files"
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 w-full px-6 py-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
          isDragging
            ? "border-sky-400 bg-sky-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <div className={`p-3 rounded-full ${isDragging ? "bg-sky-100" : "bg-gray-100"}`}>
          {hasFiles ? (
            <ImageOutlined className={isDragging ? "text-sky-500" : "text-gray-500"} sx={{ fontSize: 28 }} />
          ) : (
            <FileUploadOutlined className={isDragging ? "text-sky-500" : "text-gray-500"} sx={{ fontSize: 28 }} />
          )}
        </div>
        {hasFiles ? (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} images selected`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Click or drop to replace the current selection</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop your images here" : "Drag and drop images"}
            </p>
            <p className="text-xs text-gray-500">or click to browse multiple files</p>
          </>
        )}
      </div>
    </div>
  );
};
