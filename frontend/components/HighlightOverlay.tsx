"use client";

import React from "react";
import type { BoundingBox } from "@/lib/types";

interface HighlightOverlayProps {
  regions: BoundingBox[];
  currentPage: number;
  color?: string;
  questionLabel?: string;
}

export default function HighlightOverlay({
  regions,
  currentPage,
  color = "rgba(34, 197, 94, 0.25)",
  questionLabel,
}: HighlightOverlayProps) {
  // Filter regions for the current page
  const pageRegions = regions.filter((r) => r.page === currentPage);

  if (pageRegions.length === 0) return null;

  return (
    <>
      {pageRegions.map((region, idx) => (
        <div key={idx}>
          {/* Highlight box */}
          <div
            className="absolute border-2 border-green-500 rounded-sm transition-all duration-500 ease-out answer-highlight pointer-events-none"
            style={{
              left: `${region.x * 100}%`,
              top: `${region.y * 100}%`,
              width: `${region.width * 100}%`,
              height: `${region.height * 100}%`,
              backgroundColor: color,
            }}
          />
          
          {/* Question label badge */}
          {questionLabel && idx === 0 && (
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                left: `${region.x * 100}%`,
                top: `${region.y * 100}%`,
                transform: "translate(-2px, -100%) translateY(-4px)",
              }}
            >
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-500 text-white text-xs font-bold shadow-sm">
                Q{questionLabel}
              </span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
