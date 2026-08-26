"use client";

import React from "react";
import { 
  MappingResponse, 
  ExtractedQuestion, 
  ExtractedAnswer,
  QuestionAnswerMapping,
  UnmatchedAnswer
} from "@/lib/types";

interface MappingReviewProps {
  mappingResponse: MappingResponse;
  questions: ExtractedQuestion[];
  answers: ExtractedAnswer[];
}

export default function MappingReview({ mappingResponse, questions, answers }: MappingReviewProps) {
  const { summary, mappings, unmatchedAnswers } = mappingResponse;

  return (
    <div className="flex flex-col h-full w-full bg-veda-content-bg overflow-hidden p-6 gap-6">
      
      {/* Header / Summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-veda-gray-200 shrink-0">
        <h2 className="text-xl font-bold text-veda-dark mb-4">Mapping Results</h2>
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-sm text-veda-gray-500">Total Questions</span>
            <span className="text-2xl font-bold text-veda-dark">{summary.totalQuestions}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-veda-gray-500">Answered</span>
            <span className="text-2xl font-bold text-green-600">{summary.answered}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-veda-gray-500">Unanswered</span>
            <span className="text-2xl font-bold text-red-500">{summary.unanswered}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-veda-gray-500">Needs Review</span>
            <span className="text-2xl font-bold text-amber-500">{summary.needsReview}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-veda-gray-500">Unmatched Answers</span>
            <span className="text-2xl font-bold text-veda-orange">{summary.unmatchedAnswers}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Left: Mapped Questions */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-veda-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-veda-gray-200 bg-veda-gray-50 font-medium text-veda-dark">
            Questions & Answers
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mappings.map((mapping: QuestionAnswerMapping) => {
              const question = questions.find(q => q.id === mapping.questionId);
              const mappedAnswers = mapping.answerIds.map(aid => answers.find(a => a.answerId === aid)).filter(Boolean) as ExtractedAnswer[];
              
              let statusColor = "text-veda-gray-400";
              let statusBg = "bg-veda-gray-100";
              if (mapping.status === "answered") {
                statusColor = "text-green-700";
                statusBg = "bg-green-50";
              } else if (mapping.status === "needs_review") {
                statusColor = "text-amber-700";
                statusBg = "bg-amber-50";
              } else if (mapping.status === "unanswered") {
                statusColor = "text-red-700";
                statusBg = "bg-red-50";
              }

              return (
                <div key={mapping.questionId} className="border border-veda-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-veda-dark">
                      Q{question?.number}: {question?.text}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusBg} ${statusColor}`}>
                      {mapping.status.toUpperCase()}
                    </div>
                  </div>
                  
                  {mapping.confidence != null && mapping.status !== "unanswered" && (
                    <div className="text-xs text-veda-gray-400 mb-2">
                      Match Confidence: {Math.round(mapping.confidence * 100)}% ({mapping.method})
                    </div>
                  )}

                  {mappedAnswers.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {mappedAnswers.map(ans => (
                        <div key={ans.answerId} className="bg-veda-gray-50 p-3 rounded border border-veda-gray-200 text-sm text-veda-gray-600">
                          <span className="font-medium text-veda-gray-500 mr-2">
                            [Ans {ans.detectedQuestionLabel ? `labeled ${ans.detectedQuestionLabel}` : "unlabeled"}]
                          </span>
                          {ans.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-veda-gray-400 italic">
                      No answer found for this question.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Unmatched Answers */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-veda-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-veda-gray-200 bg-orange-50 font-medium text-veda-dark flex justify-between items-center">
            Unmatched Answers
            <span className="bg-veda-orange text-white text-xs px-2 py-1 rounded-full">{unmatchedAnswers.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {unmatchedAnswers.length === 0 ? (
              <div className="text-center text-sm text-veda-gray-400 mt-10">
                All extracted answers were successfully mapped.
              </div>
            ) : (
              unmatchedAnswers.map((ua: UnmatchedAnswer) => {
                const ans = answers.find(a => a.answerId === ua.answerId);
                return (
                  <div key={ua.answerId} className="border border-orange-200 bg-orange-50/30 rounded-lg p-3">
                    <div className="text-xs font-medium text-veda-orange mb-1">
                      Detected Label: {ua.detectedQuestionLabel || "None"}
                    </div>
                    <div className="text-xs text-veda-gray-500 mb-2">
                      Reason: {ua.reason}
                    </div>
                    <div className="text-sm text-veda-gray-600 line-clamp-4">
                      {ans?.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
