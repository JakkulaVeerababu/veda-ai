"use client";

import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AnswerMapping } from "@/lib/types";

interface QuestionCardProps {
  mapping: AnswerMapping;
  questionNumber: string;
  isSelected: boolean;
  onClick: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function QuestionCard({
  mapping,
  questionNumber,
  isSelected,
  onClick,
  isExpanded,
  onToggleExpand,
}: QuestionCardProps) {
  const { status, questionText, grading } = mapping;

  const statusColors: Record<string, string> = {
    answered: "text-veda-success",
    unanswered: "text-veda-error",
    needs_review: "text-veda-warning",
    unmatched: "text-veda-gray-500",
  };

  const scoreBg: Record<string, string> = {
    correct: "bg-green-50 text-green-700",
    mostly_correct: "bg-green-50 text-green-700",
    partially_correct: "bg-amber-50 text-amber-700",
    incorrect: "bg-red-50 text-red-700",
  };

  const scoreColor = grading
    ? scoreBg[grading.status] || "bg-veda-gray-100 text-veda-gray-600"
    : status === "unanswered"
    ? "bg-red-50 text-red-600"
    : "bg-veda-gray-100 text-veda-gray-600";

  return (
    <div
      className={`
        rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? "border-veda-orange bg-orange-50/50 shadow-sm"
            : "border-transparent bg-white hover:border-veda-gray-200 hover:shadow-sm"
        }
      `}
      onClick={onClick}
    >
      {/* Main card content */}
      <div className="p-4 flex items-start gap-3">
        {/* Question number badge */}
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold
            ${
              isSelected
                ? "bg-veda-orange text-white"
                : status === "unanswered"
                ? "bg-red-100 text-red-600"
                : "bg-veda-gray-100 text-veda-gray-700"
            }
          `}
        >
          {questionNumber.replace(/[^0-9]/g, "").slice(0, 2)}
        </div>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          {/* Sub-question label if applicable */}
          {/[a-z()]/i.test(questionNumber) && questionNumber.length > 2 && (
            <span className="text-xs text-veda-gray-400 font-medium mb-0.5 block">
              {questionNumber}
            </span>
          )}
          <p className="text-sm text-veda-dark leading-snug line-clamp-2">
            {questionText}
          </p>
        </div>

        {/* Score badge */}
        <div className="flex items-center gap-2 shrink-0">
          {grading ? (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${scoreColor}`}>
              {grading.score} / {grading.maxScore}
            </span>
          ) : status === "unanswered" ? (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${scoreColor}`}>
              0 / {mapping.grading?.maxScore || "?"}
            </span>
          ) : null}

          {/* Expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="p-1 rounded-lg hover:bg-veda-gray-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-veda-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-veda-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded: AI Feedback */}
      {isExpanded && grading && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-veda-gray-50 rounded-lg p-3 border border-veda-gray-200">
            <p className="text-xs font-semibold text-veda-dark mb-1">
              AI Feedback
            </p>
            <p className="text-xs text-veda-gray-600 leading-relaxed">
              {grading.feedback}
            </p>
          </div>
        </div>
      )}

      {/* Expanded: Unanswered state */}
      {isExpanded && status === "unanswered" && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <p className="text-xs font-semibold text-red-700">Unanswered</p>
            <p className="text-xs text-red-600 mt-1">
              No answer was detected for this question.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
