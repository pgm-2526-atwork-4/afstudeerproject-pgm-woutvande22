import { useState, useRef } from "react";
import { FileUploadOutlined, ImageOutlined } from "@mui/icons-material";

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
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect?.(file);
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

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onFileSelect?.(file);
    }
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
          {fileName ? (
            <ImageOutlined className={isDragging ? "text-sky-500" : "text-gray-500"} sx={{ fontSize: 28 }} />
          ) : (
            <FileUploadOutlined className={isDragging ? "text-sky-500" : "text-gray-500"} sx={{ fontSize: 28 }} />
          )}
        </div>
        {fileName ? (
          <p className="text-sm font-medium text-gray-700">{fileName}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop your image here" : "Drag and drop an image"}
            </p>
            <p className="text-xs text-gray-500">or click to browse</p>
          </>
        )}
      </div>
    </div>
  );
};
