"use client";

import React from "react";
import { motion } from "framer-motion";

interface ProcessingProgressProps {
  stage: string;
  progress: number;
  message: string;
}

const stages = [
  { key: "uploading", label: "Uploading files", icon: "📤" },
  { key: "extracting_questions", label: "Extracting questions", icon: "📝" },
  { key: "extracting_answers", label: "Reading handwritten answers", icon: "✍️" },
  { key: "mapping", label: "Mapping answers to questions", icon: "🔗" },
  { key: "grading", label: "Generating grades & feedback", icon: "📊" },
  { key: "preparing", label: "Preparing results", icon: "✨" },
  { key: "completed", label: "Complete", icon: "✅" },
];

export default function ProcessingProgress({
  stage,
  progress,
  message,
}: ProcessingProgressProps) {
  const currentIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Sparkle animation */}
      <div className="relative w-32 h-32 mb-8">
        {/* Large sparkle */}
        <svg
          className="sparkle-float absolute top-2 right-4"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
        >
          <path
            d="M24 0C24 0 28 18 48 24C28 30 24 48 24 48C24 48 20 30 0 24C20 18 24 0 24 0Z"
            fill="#F26522"
          />
        </svg>

        {/* Medium sparkle */}
        <svg
          className="sparkle-float-delayed absolute bottom-2 left-2"
          width="36"
          height="36"
          viewBox="0 0 48 48"
          fill="none"
        >
          <path
            d="M24 0C24 0 28 18 48 24C28 30 24 48 24 48C24 48 20 30 0 24C20 18 24 0 24 0Z"
            fill="#F26522"
          />
        </svg>

        {/* Small sparkle */}
        <svg
          className="sparkle-float-small absolute top-8 left-6"
          width="12"
          height="12"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle cx="24" cy="24" r="6" fill="#F26522" opacity="0.6" />
        </svg>

        {/* Small dot */}
        <svg
          className="sparkle-float-small absolute top-0 left-8"
          width="8"
          height="8"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle cx="24" cy="24" r="8" fill="#FBBF8E" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-veda-dark mb-2">Extracting...</h2>
      <p className="text-sm text-veda-gray-500 mb-8">This may take a while</p>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="h-2 bg-veda-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-veda-orange to-amber-400 rounded-full progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-veda-gray-400 mt-2 text-center">{progress}%</p>
      </div>

      {/* Stage checklist */}
      <div className="w-full max-w-sm space-y-3">
        {stages.map((s, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-3 text-sm ${
                isCompleted
                  ? "text-veda-success"
                  : isCurrent
                  ? "text-veda-orange font-medium"
                  : "text-veda-gray-300"
              }`}
            >
              <span className="w-5 text-center">
                {isCompleted ? "✓" : isCurrent ? "→" : "○"}
              </span>
              <span>{s.label}</span>
              {isCurrent && (
                <motion.span
                  className="ml-auto text-xs text-veda-gray-400"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  •••
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Current message */}
      {message && (
        <p className="mt-6 text-xs text-veda-gray-400 text-center max-w-md">
          {message}
        </p>
      )}
    </div>
  );
}
