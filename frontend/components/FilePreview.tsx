"use client";

import React from "react";
import { X, FileText } from "lucide-react";

interface FilePreviewProps {
  fileName: string;
  fileSize: number; // in bytes
  pageCount: number;
  onRemove: () => void;
}

export default function FilePreview({
  fileName,
  fileSize,
  pageCount,
  onRemove,
}: FilePreviewProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="relative bg-veda-gray-100 rounded-xl p-4 flex items-center gap-3 group">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-6 h-6 bg-veda-gray-600 hover:bg-veda-gray-800 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
        aria-label="Remove file"
      >
        <X size={14} />
      </button>

      {/* PDF icon */}
      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
        <FileText size={20} className="text-red-500" />
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-veda-dark truncate">
          {fileName}
        </p>
        <p className="text-xs text-veda-gray-500 mt-0.5">
          {formatSize(fileSize)} • {pageCount} {pageCount === 1 ? "Page" : "Pages"}
        </p>
      </div>
    </div>
  );
}
