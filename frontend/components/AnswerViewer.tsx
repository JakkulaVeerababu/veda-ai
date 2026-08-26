"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import HighlightOverlay from "./HighlightOverlay";
import type { BoundingBox } from "@/lib/types";

import { getAnswerPageUrl } from "@/lib/api";

interface AnswerViewerProps {
  jobId: string;
  totalPages: number;
  selectedRegions: BoundingBox[];
  selectedQuestionLabel?: string;
  targetPage?: number; // Page to navigate to (1-indexed)
  onPageChange?: (page: number) => void;
}

export default function AnswerViewer({
  jobId,
  totalPages,
  selectedRegions,
  selectedQuestionLabel,
  targetPage,
  onPageChange,
}: AnswerViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Navigate to target page when a question is selected
  useEffect(() => {
    if (targetPage && targetPage >= 1 && targetPage <= totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(targetPage);
    }
  }, [targetPage, totalPages]);

  // Notify parent of page changes
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  // Scroll to highlighted region when page changes
  useEffect(() => {
    if (selectedRegions.length > 0 && containerRef.current) {
      const pageRegions = selectedRegions.filter(
        (r) => r.page === currentPage
      );
      if (pageRegions.length > 0) {
        // Wait for image render, then scroll to the first region
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
        }, 150);
      }
    }
  }, [selectedRegions, currentPage]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 25, 250));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 25, 50));
  }, []);

  const handleFitWidth = useCallback(() => {
    setZoom(100);
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  if (totalPages === 0) {
    return (
      <div className="flex items-center justify-center h-full text-veda-gray-400">
        No answer sheet loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-veda-gray-700 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-veda-gray-800 shrink-0">
        <h3 className="text-sm font-medium text-white">
          {selectedQuestionLabel ? `Showing Answer for Q${selectedQuestionLabel}` : "Answer Sheet"}
        </h3>

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
            <span className="text-xs text-veda-gray-300 w-10 text-center cursor-pointer" onClick={handleFitWidth} title="Fit Width">
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
        className="flex-1 overflow-auto custom-scrollbar flex justify-center p-4 relative"
      >
        <div
          ref={pageRef}
          className="relative shadow-2xl transition-all duration-200"
          style={{
            width: `${zoom}%`,
            maxWidth: `${zoom * 10}px`, // Roughly bounded by zoom ratio
            minWidth: `${zoom * 4}px`
          }}
        >
          {/* Page image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`${jobId}-${currentPage}`}
            src={getAnswerPageUrl(jobId, currentPage)}
            alt={`Answer sheet page ${currentPage}`}
            className="w-full h-auto block object-contain"
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
