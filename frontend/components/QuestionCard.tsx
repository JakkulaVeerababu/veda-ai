import React from "react";
import { ExtractedQuestion } from "@/lib/types";

interface QuestionCardProps {
  question: ExtractedQuestion;
  selected?: boolean;
}

export default function QuestionCard({ question, selected }: QuestionCardProps) {
  return (
    <div
      className={`
        p-4 rounded-xl border transition-all duration-200 cursor-default
        ${
          selected
            ? "border-veda-orange bg-orange-50/50 shadow-sm"
            : "border-veda-gray-200 bg-white hover:border-veda-gray-300"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Question Number Badge */}
        <div
          className={`
            shrink-0 flex items-center justify-center h-8 px-3 rounded-lg text-sm font-semibold
            ${
              selected
                ? "bg-veda-orange text-white"
                : "bg-veda-gray-100 text-veda-dark"
            }
          `}
        >
          Q{question.number}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            {question.marks !== null && question.marks !== undefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {question.marks} Marks
              </span>
            )}
            
            {/* Optional Dev Mode Confidence */}
            {question.confidence !== null && question.confidence !== undefined && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-500 ml-auto">
                Conf: {Math.round(question.confidence * 100)}%
              </span>
            )}
          </div>
          
          <p className="text-sm text-veda-dark font-medium leading-relaxed">
            {question.text}
          </p>
        </div>
      </div>
    </div>
  );
}
