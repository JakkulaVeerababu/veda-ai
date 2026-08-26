"use client";

import React, { useState } from "react";
import type { AnswerMapping } from "@/lib/types";
import QuestionCard from "./QuestionCard";

interface QuestionListProps {
  mappings: AnswerMapping[];
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

export default function QuestionList({
  mappings,
  selectedQuestionId,
  onSelectQuestion,
}: QuestionListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(mappings.map((m) => m.questionId)));
    }
    setExpandAll(!expandAll);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-veda-gray-200 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-veda-dark">
          Extracted Questions{" "}
          <span className="text-veda-gray-400 font-normal">(from question paper)</span>
        </h2>
        <button
          onClick={handleExpandAll}
          className="text-xs font-medium text-veda-orange hover:text-veda-orange-hover transition-colors"
        >
          {expandAll ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {mappings.map((mapping) => (
          <QuestionCard
            key={mapping.questionId}
            mapping={mapping}
            questionNumber={mapping.questionId}
            isSelected={selectedQuestionId === mapping.questionId}
            onClick={() => onSelectQuestion(mapping.questionId)}
            isExpanded={expandedIds.has(mapping.questionId)}
            onToggleExpand={() => toggleExpand(mapping.questionId)}
          />
        ))}
      </div>
    </div>
  );
}
