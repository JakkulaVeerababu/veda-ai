"use client";

import React from "react";
import type { ExtractedQuestion } from "@/lib/types";
import QuestionCard from "./QuestionCard";

interface QuestionListProps {
  questions: ExtractedQuestion[];
}

export default function QuestionList({
  questions,
}: QuestionListProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="px-5 py-4 border-b border-veda-gray-200 bg-white flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-veda-dark">
            Questions Extracted
          </h2>
          <p className="text-xs text-veda-gray-500 mt-0.5">
            {questions.length} {questions.length === 1 ? 'question' : 'questions'} found
          </p>
        </div>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-veda-gray-400 text-sm">No questions detected.</p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
            />
          ))
        )}
      </div>
    </div>
  );
}
