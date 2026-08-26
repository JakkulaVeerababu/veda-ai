"use client";

import React, { useState, useMemo } from "react";
import {
  MappingResponse,
  ExtractedQuestion,
  ExtractedAnswer,
  QuestionAnswerMapping,
} from "@/lib/types";
import AnswerViewer from "./AnswerViewer";
import { AlertCircle } from "lucide-react";

interface ResultsLayoutProps {
  jobId: string;
  totalPages: number;
  mappingResponse: MappingResponse;
  questions: ExtractedQuestion[];
  answers: ExtractedAnswer[];
}

export default function ResultsLayout({
  jobId,
  totalPages,
  mappingResponse,
  questions,
  answers,
}: ResultsLayoutProps) {
  const { summary, mappings, unmatchedAnswers } = mappingResponse;

  // 2. Data Lookups
  const answerById = useMemo(() => {
    const map = new Map<string, ExtractedAnswer>();
    answers.forEach((a) => map.set(a.answerId, a));
    return map;
  }, [answers]);

  const mappingByQuestionId = useMemo(() => {
    const map = new Map<string, QuestionAnswerMapping>();
    mappings.forEach((m) => map.set(m.questionId, m));
    return map;
  }, [mappings]);

  const realTotalPages = useMemo(() => {
    let max = totalPages;
    answers.forEach(a => {
      a.regions.forEach(r => {
        if (r.page > max) max = r.page;
      });
    });
    return max;
  }, [totalPages, answers]);

  // 3. State
  // Default select the first answered question
  const defaultSelectedQuestionId = useMemo(() => {
    const firstAnswered = mappings.find((m) => m.status === "answered");
    return firstAnswered ? firstAnswered.questionId : (questions[0]?.id || null);
  }, [mappings, questions]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(defaultSelectedQuestionId);
  const [selectedUnmatchedId, setSelectedUnmatchedId] = useState<string | null>(null);
  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const [viewerPage, setViewerPage] = useState<number | undefined>(undefined);

  // 3. Derived Selection
  let activeQuestion: ExtractedQuestion | undefined;
  let activeMapping: QuestionAnswerMapping | undefined;
  let activeAnswer: ExtractedAnswer | undefined;
  let activeQuestionLabel: string | undefined;

  if (selectedQuestionId) {
    activeQuestion = questions.find((q) => q.id === selectedQuestionId);
    activeMapping = mappingByQuestionId.get(selectedQuestionId);
    if (activeMapping && activeMapping.answerIds.length > 0) {
      activeAnswer = answerById.get(activeMapping.answerIds[0]);
    }
    activeQuestionLabel = activeQuestion?.number;
  } else if (selectedUnmatchedId) {
    activeAnswer = answerById.get(selectedUnmatchedId);
  }

  const activeRegions = activeAnswer?.regions || [];
  
  // Sort regions by page, y, x
  const sortedRegions = [...activeRegions].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // 4. Handlers
  const handleQuestionClick = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setSelectedUnmatchedId(null);
    setCurrentRegionIndex(0);

    const mapping = mappingByQuestionId.get(questionId);
    if (mapping && mapping.answerIds.length > 0) {
      const ans = answerById.get(mapping.answerIds[0]);
      if (ans && ans.regions.length > 0) {
        const sorted = [...ans.regions].sort((a, b) => a.page - b.page);
        setViewerPage(sorted[0].page);
      }
    }
  };

  const handleUnmatchedClick = (answerId: string) => {
    setSelectedUnmatchedId(answerId);
    setSelectedQuestionId(null);
    setCurrentRegionIndex(0);

    const ans = answerById.get(answerId);
    if (ans && ans.regions.length > 0) {
      const sorted = [...ans.regions].sort((a, b) => a.page - b.page);
      setViewerPage(sorted[0].page);
    }
  };

  const handleNextRegion = () => {
    if (currentRegionIndex < sortedRegions.length - 1) {
      const nextIdx = currentRegionIndex + 1;
      setCurrentRegionIndex(nextIdx);
      setViewerPage(sortedRegions[nextIdx].page);
    }
  };

  const handlePrevRegion = () => {
    if (currentRegionIndex > 0) {
      const prevIdx = currentRegionIndex - 1;
      setCurrentRegionIndex(prevIdx);
      setViewerPage(sortedRegions[prevIdx].page);
    }
  };

  // Helper to safely display multi-page status
  const getPageRange = () => {
    if (sortedRegions.length === 0) return null;
    const pages = Array.from(new Set(sortedRegions.map(r => r.page)));
    if (pages.length === 1) return `Page ${pages[0]}`;
    return `Pages ${pages[0]}–${pages[pages.length - 1]}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-veda-content-bg overflow-hidden gap-4 p-4 lg:p-6">
      {/* Header Summary */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-veda-gray-200 shrink-0 flex flex-wrap gap-6 items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-veda-dark">Assessment Mapping Complete</h2>
          <p className="text-sm text-veda-gray-500">Select a question to view its exact answer location.</p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-veda-gray-500">Total Questions</span>
            <span className="text-xl font-bold text-veda-dark">{summary.totalQuestions}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-veda-gray-500">Answered</span>
            <span className="text-xl font-bold text-green-600">{summary.answered}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-veda-gray-500">Unanswered</span>
            <span className="text-xl font-bold text-red-500">{summary.unanswered}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-veda-gray-500">Needs Review</span>
            <span className="text-xl font-bold text-amber-500">{summary.needsReview}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 lg:gap-6 overflow-hidden flex-col lg:flex-row">
        {/* Left: Questions Panel (approx 35-40%) */}
        <div className="w-full lg:w-5/12 max-w-lg flex flex-col bg-white rounded-xl shadow-sm border border-veda-gray-200 overflow-hidden">
          <div className="p-4 border-b border-veda-gray-200 bg-veda-gray-50 font-medium text-veda-dark flex justify-between items-center">
            Questions
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {questions.map((q) => {
              const m = mappingByQuestionId.get(q.id);
              const status = m?.status || "unanswered";
              const isSelected = selectedQuestionId === q.id;
              
              let statusLabel = status.replace("_", " ");
              let statusColor = "";
              let statusBg = "";
              
              if (status === "answered") {
                statusLabel = "✓ Answered";
                statusColor = "text-green-700";
                statusBg = "bg-green-100";
              } else if (status === "needs_review") {
                statusLabel = "Needs Review";
                statusColor = "text-amber-700";
                statusBg = "bg-amber-100";
              } else {
                statusLabel = "Unanswered";
                statusColor = "text-red-700";
                statusBg = "bg-red-100";
              }

              return (
                <button 
                  key={q.id} 
                  onClick={() => handleQuestionClick(q.id)}
                  className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-veda-dark rounded-xl"
                  aria-current={isSelected ? "true" : "false"}
                >
                  <div
                    className={`
                      p-4 rounded-xl border transition-all duration-200
                      ${
                        isSelected
                          ? "border-veda-dark bg-veda-gray-50 shadow-sm"
                          : "border-veda-gray-200 bg-white hover:border-veda-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                          shrink-0 flex items-center justify-center h-8 px-3 rounded-lg text-sm font-semibold
                          ${
                            isSelected
                              ? "bg-veda-dark text-white"
                              : "bg-veda-gray-100 text-veda-dark"
                          }
                        `}
                      >
                        Q{q.number}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusBg} ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-sm text-veda-dark font-medium leading-relaxed">
                          {q.text}
                        </p>

                        {/* If this is selected, show extra details */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-veda-gray-200">
                            {status === "unanswered" ? (
                              <div className="flex items-start gap-2 text-red-600 text-sm">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>No answer was detected for this question.</span>
                              </div>
                            ) : status === "needs_review" ? (
                              <div className="flex items-start gap-2 text-amber-600 text-sm mb-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>Possible matching answer shown. Mapping confidence is low.</span>
                              </div>
                            ) : null}

                            {activeAnswer && (
                              <div className="bg-white border border-veda-gray-200 p-3 rounded-lg text-sm text-veda-gray-600">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="font-semibold text-xs text-veda-gray-400 uppercase tracking-wide">
                                    Extracted Text
                                  </div>
                                  <div className="text-xs font-medium text-veda-gray-400">
                                    {getPageRange()}
                                  </div>
                                </div>
                                <p className="line-clamp-4 leading-relaxed">{activeAnswer.text}</p>
                              </div>
                            )}

                            {/* Missing region handling */}
                            {activeAnswer && activeAnswer.regions.length === 0 && (
                              <div className="mt-2 text-sm text-veda-orange bg-orange-50 p-2 rounded">
                                Answer text was detected, but its exact location could not be identified.
                              </div>
                            )}

                            {/* Multi-region navigator */}
                            {sortedRegions.length > 1 && (
                              <div className="mt-3 flex items-center justify-between bg-veda-gray-100 rounded-lg p-1.5 border border-veda-gray-200">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePrevRegion(); }}
                                  disabled={currentRegionIndex === 0}
                                  className="text-xs px-2 py-1 rounded hover:bg-white disabled:opacity-50 font-medium"
                                >
                                  &larr; Previous region
                                </button>
                                <span className="text-xs font-medium text-veda-gray-500">
                                  Answer region {currentRegionIndex + 1} of {sortedRegions.length}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleNextRegion(); }}
                                  disabled={currentRegionIndex === sortedRegions.length - 1}
                                  className="text-xs px-2 py-1 rounded hover:bg-white disabled:opacity-50 font-medium"
                                >
                                  Next region &rarr;
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Unmatched Answers Section */}
            {unmatchedAnswers.length > 0 && (
              <div className="mt-6 pt-4 border-t border-veda-gray-200">
                <div className="font-semibold text-veda-dark mb-3 flex items-center justify-between">
                  <span>Unmatched Answers</span>
                  <span className="bg-veda-orange text-white text-xs px-2 py-0.5 rounded-full">
                    {unmatchedAnswers.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {unmatchedAnswers.map((ua) => {
                    const ans = answerById.get(ua.answerId);
                    const isSelected = selectedUnmatchedId === ua.answerId;
                    return (
                      <button
                        key={ua.answerId}
                        onClick={() => handleUnmatchedClick(ua.answerId)}
                        className={`
                          w-full text-left p-3 rounded-xl border transition-all duration-200
                          ${
                            isSelected
                              ? "border-veda-orange bg-orange-50 shadow-sm"
                              : "border-orange-200 bg-orange-50/30 hover:border-orange-300"
                          }
                        `}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-xs font-bold text-veda-orange uppercase">
                            Detected Label: {ua.detectedQuestionLabel || "None"}
                          </div>
                          {isSelected && ans && (
                            <div className="text-xs text-veda-orange">
                              Page {ans.regions[0]?.page}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-veda-gray-600 line-clamp-3">
                          {ans?.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Answer Viewer (approx 60-65%) */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-veda-gray-200 overflow-hidden flex flex-col">
          <AnswerViewer
            jobId={jobId}
            totalPages={realTotalPages}
            selectedRegions={activeRegions}
            selectedQuestionLabel={activeQuestionLabel}
            targetPage={viewerPage}
            onPageChange={(page) => setViewerPage(page)}
          />
        </div>
      </div>
    </div>
  );
}
