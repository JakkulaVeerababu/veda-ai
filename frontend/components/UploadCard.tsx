"use client";

import React, { useCallback, useState, useRef } from "react";
import { Upload } from "lucide-react";

interface UploadCardProps {
  label: string;
  highlightWord: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function UploadCard({
  label,
  highlightWord,
  accept = ".pdf,.png,.jpg,.jpeg",
  maxSizeMB = 10,
  onFileSelect,
  disabled = false,
}: UploadCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          alert(`File exceeds ${maxSizeMB}MB limit`);
          return;
        }
        onFileSelect(file);
      }
    },
    [disabled, maxSizeMB, onFileSelect]
  );

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File exceeds ${maxSizeMB}MB limit`);
        return;
      }
      onFileSelect(file);
    }
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div
      className={`
        upload-zone cursor-pointer
        flex flex-col items-center justify-center
        min-h-[180px] p-8
        ${dragOver ? "dragover" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {/* Upload icon */}
      <div className="w-12 h-12 rounded-xl bg-veda-gray-100 flex items-center justify-center mb-4">
        <Upload size={22} className="text-veda-gray-500" />
      </div>

      {/* Label */}
      <p className="text-base font-medium text-veda-dark">
        Upload{" "}
        <span className="text-veda-orange">{highlightWord}</span>
      </p>

      {/* Max size */}
      <p className="text-xs text-veda-gray-400 mt-1">
        Max {maxSizeMB}MB
      </p>
    </div>
  );
}
