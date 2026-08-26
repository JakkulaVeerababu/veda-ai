"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import HighlightOverlay from "./HighlightOverlay";
import type { BoundingBox } from "@/lib/types";

interface AnswerViewerProps {
  pages: string[]; // base64-encoded page images
  selectedRegions: BoundingBox[];
  selectedQuestionLabel?: string;
  targetPage?: number; // Page to navigate to (1-indexed)
}

export default function AnswerViewer({
  pages,
  selectedRegions,
  selectedQuestionLabel,
  targetPage,
}: AnswerViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const totalPages = pages.length;

  // Navigate to target page when a question is selected
  useEffect(() => {
    if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
    }
  }, [targetPage, totalPages]);

  // Scroll to highlighted region when page changes
  useEffect(() => {
    if (selectedRegions.length > 0 && containerRef.current) {
      const pageRegions = selectedRegions.filter(
        (r) => r.page === currentPage
      );
      if (pageRegions.length > 0) {
        // Wait for render, then scroll to the first region
        setTimeout(() => {
          const firstRegion = pageRegions[0];
          if (containerRef.current && pageRef.current) {
            const containerHeight = containerRef.current.clientHeight;
            const pageHeight = pageRef.current.clientHeight;
            const regionTop = firstRegion.y * pageHeight;
            const scrollTarget = regionTop - containerHeight / 4;
            containerRef.current.scrollTo({
              top: Math.max(0, scrollTarget),
              behavior: "smooth",
            });
          }
        }, 100);
      }
    }
  }, [selectedRegions, currentPage]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 25, 250));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 25, 50));
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-veda-gray-400">
        No answer sheet loaded
      </div>
    );
  }

  const currentImageB64 = pages[currentPage - 1];

  return (
    <div className="flex flex-col h-full bg-veda-gray-700">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-veda-gray-800 shrink-0">
        <h3 className="text-sm font-medium text-white">Answer Sheet</h3>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-veda-gray-700 rounded-lg px-2 py-1">
            <button
              onClick={handleZoomOut}
              className="p-1 text-veda-gray-300 hover:text-white transition-colors"
              aria-label="Zoom out"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs text-veda-gray-300 w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 text-veda-gray-300 hover:text-white transition-colors"
              aria-label="Zoom in"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1 bg-veda-gray-700 rounded-lg px-2 py-1">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="p-1 text-veda-gray-300 hover:text-white disabled:text-veda-gray-600 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-veda-gray-300 min-w-[80px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-1 text-veda-gray-300 hover:text-white disabled:text-veda-gray-600 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Page viewer */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto custom-scrollbar flex justify-center p-4"
      >
        <div
          ref={pageRef}
          className="relative shadow-2xl"
          style={{
            width: `${zoom}%`,
            maxWidth: `${zoom * 8}px`,
          }}
        >
          {/* Page image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${currentImageB64}`}
            alt={`Answer sheet page ${currentPage}`}
            className="w-full h-auto block"
            draggable={false}
          />

          {/* Highlight overlays */}
          <HighlightOverlay
            regions={selectedRegions}
            currentPage={currentPage}
            questionLabel={selectedQuestionLabel}
          />
        </div>
      </div>
    </div>
  );
}
