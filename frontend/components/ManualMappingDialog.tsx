import React, { useState } from "react";
import { X } from "lucide-react";
import { UnmatchedAnswer } from "@/lib/types";

interface ManualMappingDialogProps {
  questionId: string;
  questionNumber: string;
  questionText: string;
  unmatchedAnswers: UnmatchedAnswer[];
  onClose: () => void;
  onSave: (answerId: string | null) => void;
}

export default function ManualMappingDialog({
  questionId,
  questionNumber,
  questionText,
  unmatchedAnswers,
  onClose,
  onSave,
}: ManualMappingDialogProps) {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null | undefined>(undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Manual Mapping</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Question {questionNumber}</p>
            <p className="text-sm text-gray-800 line-clamp-3">{questionText}</p>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-3">Select correct answer block:</p>
          
          <div className="space-y-2">
            {unmatchedAnswers.length > 0 ? unmatchedAnswers.map((ua) => (
              <label 
                key={ua.answer.answerId}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAnswerId === ua.answer.answerId ? 'border-veda-dark bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input 
                  type="radio" 
                  name="manualMapping" 
                  className="mt-1 accent-veda-dark"
                  checked={selectedAnswerId === ua.answer.answerId}
                  onChange={() => setSelectedAnswerId(ua.answer.answerId)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      Answer Block {ua.answer.sequence}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      Page {ua.answer.regions[0]?.page || '?'}
                    </span>
                  </div>
                  {ua.answer.detectedQuestionLabel && (
                    <p className="text-xs text-gray-500 mb-1">Label: {ua.answer.detectedQuestionLabel}</p>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2">{ua.answer.text}</p>
                </div>
              </label>
            )) : (
              <p className="text-sm text-gray-500 italic">No unmatched answers available.</p>
            )}

            {/* No Answer Option */}
            <label 
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedAnswerId === null ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input 
                type="radio" 
                name="manualMapping" 
                className="accent-red-600"
                checked={selectedAnswerId === null}
                onChange={() => setSelectedAnswerId(null)}
              />
              <span className="text-sm font-medium text-gray-900">No Answer</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (selectedAnswerId !== undefined) {
                onSave(selectedAnswerId);
              }
            }}
            disabled={selectedAnswerId === undefined}
            className="px-4 py-2 text-sm font-medium text-white bg-veda-dark rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Mapping
          </button>
        </div>

      </div>
    </div>
  );
}
