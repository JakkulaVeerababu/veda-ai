"use client";

import React, { useState } from "react";
import { ExtractedAnswer } from "@/lib/types";
import { getAnswerPageUrl } from "@/lib/api";

interface AnswerDebugViewProps {
  jobId: string;
  answers: ExtractedAnswer[];
}

export default function AnswerDebugView({ jobId, answers }: AnswerDebugViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<ExtractedAnswer | null>(null);

  // Use the first region's page for the preview image
  const previewPage = selectedAnswer?.regions?.[0]?.page || 1;

  return (
    <div className="flex h-full w-full bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Left panel: List of answers */}
      <div className="w-1/3 border-r border-veda-gray-200 flex flex-col h-full bg-veda-gray-50">
        <div className="p-4 border-b border-veda-gray-200 bg-white">
          <h2 className="font-semibold text-veda-dark">Extracted Answers</h2>
          <p className="text-sm text-veda-gray-500">{answers.length} answer blocks detected</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {answers.length === 0 ? (
            <div className="text-center text-sm text-veda-gray-500 mt-10">
              No answers detected.
            </div>
          ) : (
            answers.map((ans) => {
              const isSelected = selectedAnswer?.answerId === ans.answerId;
              return (
                <div
                  key={ans.answerId}
                  onClick={() => setSelectedAnswer(ans)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-veda-orange bg-orange-50 shadow-sm"
                      : "border-veda-gray-200 bg-white hover:border-veda-orange/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-veda-dark text-sm">
                      {ans.detectedQuestionLabel ? `Q: ${ans.detectedQuestionLabel}` : "No label detected"}
                    </span>
                    <span className="text-xs text-veda-gray-400 font-medium">
                      Page {ans.regions[0]?.page || "?"}
                    </span>
                  </div>
                  
                  {ans.confidence != null && (
                    <div className="text-xs text-veda-gray-500 mb-2">
                      Confidence: {Math.round(ans.confidence * 100)}%
                    </div>
                  )}

                  <p className="text-sm text-veda-gray-600 line-clamp-3">
                    {ans.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Region Overlay Preview */}
      <div className="flex-1 flex flex-col bg-veda-gray-100 h-full overflow-hidden">
        {selectedAnswer ? (
          <>
            <div className="p-4 bg-white border-b border-veda-gray-200 shrink-0">
              <h3 className="font-medium text-veda-dark">
                Preview: Answer Block {selectedAnswer.sequence}
              </h3>
              <p className="text-sm text-veda-gray-500">
                Displaying Page {previewPage}
              </p>
            </div>
            
            <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
              <div className="relative shadow-lg bg-white inline-block max-w-full">
                <img
                  src={getAnswerPageUrl(jobId, previewPage)}
                  alt={`Answer page ${previewPage}`}
                  className="block w-full h-auto object-contain"
                  style={{ maxHeight: "1200px" }}
                />
                
                {/* Draw regions for the selected answer on THIS page */}
                {selectedAnswer.regions
                  .filter((r) => r.page === previewPage)
                  .map((region, idx) => (
                    <div
                      key={idx}
                      className="absolute border-2 border-veda-orange bg-veda-orange/10 pointer-events-none"
                      style={{
                        left: `${region.x * 100}%`,
                        top: `${region.y * 100}%`,
                        width: `${region.width * 100}%`,
                        height: `${region.height * 100}%`,
                      }}
                    />
                  ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-veda-gray-400">
            Select an answer to view its bounding region
          </div>
        )}
      </div>
    </div>
  );
}
