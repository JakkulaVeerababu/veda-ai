"use client";

import React, { useState, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import UploadCard from "@/components/UploadCard";
import FilePreview from "@/components/FilePreview";
import ProcessingProgress from "@/components/ProcessingProgress";
import QuestionList from "@/components/QuestionList";

import ResultsLayout from "@/components/ResultsLayout";
import { uploadAndProcess, pollUntilComplete, extractQuestions, extractAnswers, getAssessmentResults, updateMapping, gradeAnswers } from "@/lib/api";
import type { UploadedFile, ExtractedQuestion, ExtractedAnswer, ProcessingStatus, AssessmentResults } from "@/lib/types";

type AppScreen = "upload" | "processing" | "results";

export default function HomePage() {
  // ── State ──
  const [screen, setScreen] = useState<AppScreen>("upload");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [questionPaper, setQuestionPaper] = useState<UploadedFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<UploadedFile | null>(null);
  const [processingStage, setProcessingStage] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[] | null>(null);
  const [extractedAnswers, setExtractedAnswers] = useState<ExtractedAnswer[] | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtractingFailed, setIsExtractingFailed] = useState(false);
  const [failedStep, setFailedStep] = useState<"questions" | "answers" | "mapping" | "grading" | null>(null);

  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);

  // ── Derived ──
  const bothFilesUploaded = !!questionPaper && !!answerSheet;
  const isProcessingScreen = screen === "processing";

  // ── File handlers ──
  const handleQuestionPaperSelect = useCallback((file: File) => {
    const pageEstimate = file.type === "application/pdf" ? Math.max(1, Math.round(file.size / 200000)) : 1;
    setQuestionPaper({
      file,
      name: file.name,
      size: file.size,
      pages: pageEstimate,
      type: file.type,
    });
  }, []);

  const handleAnswerSheetSelect = useCallback((file: File) => {
    const pageEstimate = file.type === "application/pdf" ? Math.max(1, Math.round(file.size / 150000)) : 1;
    setAnswerSheet({
      file,
      name: file.name,
      size: file.size,
      pages: pageEstimate,
      type: file.type,
    });
  }, []);

  // ── Phase 3 Extraction ──
  const runExtraction = async (currentJobId: string) => {
    setProcessingStage("extracting_questions");
    setProcessingProgress(40);
    setProcessingMessage("Extracting questions...");
    setIsExtractingFailed(false);
    setFailedStep(null);
    
    try {
      const response = await extractQuestions(currentJobId);
      if (response && response.questions) {
        setExtractedQuestions(response.questions);
        // Automatically start Phase 4
        await runAnswerExtraction(currentJobId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      setError(msg);
      setIsExtractingFailed(true);
      setFailedStep("questions");
      setScreen("processing");
    }
  };

  // ── Phase 4 Extraction ──
  const runAnswerExtraction = async (currentJobId: string) => {
    setProcessingStage("extracting_answers");
    setProcessingProgress(60);
    setProcessingMessage("Reading handwritten answers...");
    setIsExtractingFailed(false);
    setFailedStep(null);
    
    try {
      const response = await extractAnswers(currentJobId);
      if (response && response.answers) {
        setExtractedAnswers(response.answers);
        // Automatically start Phase 5
        await runMapAnswers(currentJobId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Answer extraction failed";
      setError(msg);
      setIsExtractingFailed(true);
      setFailedStep("answers");
      setScreen("processing");
    }
  };

  // ── Phase 5 Mapping ──
  const runMapAnswers = async (currentJobId: string) => {
    import("@/lib/api").then(async ({ mapAnswers }) => {
      setProcessingStage("mapping");
      setProcessingProgress(85);
      setProcessingMessage("Mapping answers to questions...");
      setIsExtractingFailed(false);
      setFailedStep(null);
      
      try {
        await mapAnswers(currentJobId);
        
        // Phase 5.5: Grading
        setProcessingStage("grading");
        setProcessingProgress(90);
        setProcessingMessage("Generating grades & feedback...");
        await gradeAnswers(currentJobId);
        
        // Phase 6: Fetch consolidated results
        setProcessingStage("preparing");
        setProcessingProgress(95);
        setProcessingMessage("Preparing results dashboard...");
        
        const results = await getAssessmentResults(currentJobId);
        setAssessmentResults(results);
        setScreen("results");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Mapping or grading failed";
        setError(msg);
        setIsExtractingFailed(true);
        setFailedStep("mapping");
        setScreen("processing");
      }
    });
  };

  // ── Manual Mapping Update ──
  const handleUpdateMapping = async (questionId: string, answerId: string | null) => {
    if (!jobId) return;
    try {
      await updateMapping(jobId, questionId, answerId);
      const results = await getAssessmentResults(jobId);
      setAssessmentResults(results);
    } catch (err) {
      console.error("Failed to update mapping:", err);
      alert("Failed to update mapping. Please try again.");
    }
  };

  // ── Start Mapping (Phase 2 -> Phase 3) ──
  const handleStartMapping = async () => {
    if (!questionPaper || !answerSheet) return;

    setScreen("processing");
    setError(null);
    setProcessingStage("uploading");
    setProcessingProgress(5);
    setProcessingMessage("Uploading files...");

    try {
      const newJobId = await uploadAndProcess(
        questionPaper.file,
        answerSheet.file
      );
      setJobId(newJobId);

      // Wait for Phase 2 documents to prepare
      await pollUntilComplete(
        newJobId,
        (status: ProcessingStatus) => {
          setProcessingStage(status.stage);
          setProcessingProgress(status.progress);
          setProcessingMessage(status.message);
        },
        2000
      );
      
      // Move to Phase 3
      await runExtraction(newJobId);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setError(msg);
      setScreen("upload");
    }
  };

  // ── Back to upload ──
  const handleBack = () => {
    setScreen("upload");
    setExtractedQuestions(null);
    setExtractedAnswers(null);
    setJobId(null);
    setQuestionPaper(null);
    setAnswerSheet(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-veda-content-bg">
      {/* Sidebar */}
      <Sidebar
        collapsed={isProcessingScreen || screen === "results" ? true : sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          title="Exams"
          showBack={screen !== "upload"}
          onBack={handleBack}
        />

        {/* ═══════════════════════════════════════════ */}
        {/* SCREEN 1: Upload */}
        {/* ═══════════════════════════════════════════ */}
        {screen === "upload" && (
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
              {/* Heading */}
              <div className="text-center mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-veda-dark mb-2">
                  Upload{" "}
                  <span className="text-veda-orange bg-veda-orange-light px-2 py-1 rounded-lg">
                    Question Paper & Answer Sheets
                  </span>
                </h1>
                <p className="text-veda-gray-500 mt-3">
                  Upload both files to get started
                </p>
              </div>

              {/* Teacher illustration */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-100 via-orange-200 to-orange-100 p-1 shadow-lg shadow-orange-100">
                    <img
                      src="/teacher-avatar.jpg"
                      alt="Teacher"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {/* Decorative dots */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-veda-orange opacity-60" />
                  <div className="absolute -bottom-1 left-0 w-2.5 h-2.5 rounded-full bg-veda-orange opacity-40" />
                  <div className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-veda-orange opacity-50" />
                  <div className="absolute bottom-2 -left-3 w-3 h-3 rounded-full bg-orange-200 opacity-70" />
                </div>
              </div>

              {/* Upload cards container */}
              <div className="bg-white rounded-2xl border border-dashed border-veda-gray-300 p-6 lg:p-8 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Question Paper */}
                  <div>
                    {questionPaper ? (
                      <div className="upload-zone p-6 min-h-[180px] flex items-center justify-center">
                        <FilePreview
                          fileName={questionPaper.name}
                          fileSize={questionPaper.size}
                          pageCount={questionPaper.pages}
                          onRemove={() => setQuestionPaper(null)}
                        />
                      </div>
                    ) : (
                      <UploadCard
                        label="Upload Question Paper"
                        highlightWord="Question Paper"
                        onFileSelect={handleQuestionPaperSelect}
                      />
                    )}
                  </div>

                  {/* Answer Sheet */}
                  <div>
                    {answerSheet ? (
                      <div className="upload-zone p-6 min-h-[180px] flex items-center justify-center">
                        <FilePreview
                          fileName={answerSheet.name}
                          fileSize={answerSheet.size}
                          pageCount={answerSheet.pages}
                          onRemove={() => setAnswerSheet(null)}
                        />
                      </div>
                    ) : (
                      <UploadCard
                        label="Upload Answer Sheet"
                        highlightWord="Answer Sheet"
                        onFileSelect={handleAnswerSheetSelect}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Start Mapping Button */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStartMapping}
                  disabled={!bothFilesUploaded}
                  className={`
                    flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm
                    transition-all duration-200
                    ${
                      bothFilesUploaded
                        ? "bg-veda-dark text-white hover:bg-veda-gray-800 shadow-lg hover:shadow-xl cursor-pointer"
                        : "bg-veda-gray-200 text-veda-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  Start Mapping
                  <ArrowRight size={16} />
                </button>

                <p className="text-xs text-veda-gray-400">
                  Once both files are uploaded, you&apos;ll able to map answers with
                  questions
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                     onClick={() => setError(null)}
                     className="mt-2 text-xs text-red-500 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SCREEN 2: Processing */}
        {/* ═══════════════════════════════════════════ */}
        {screen === "processing" && (
          <main className="flex-1 overflow-y-auto bg-white rounded-tl-2xl flex flex-col relative">
            <ProcessingProgress
              stage={processingStage}
              progress={processingProgress}
              message={processingMessage}
            />
            {isExtractingFailed && (
              <div className="absolute inset-x-0 bottom-10 flex flex-col items-center">
                <p className="text-red-500 font-medium mb-4">{error}</p>
                <button
                  onClick={() => {
                    if (jobId) {
                      if (failedStep === "questions") runExtraction(jobId);
                      if (failedStep === "answers") runAnswerExtraction(jobId);
                      if (failedStep === "mapping" || failedStep === "grading") runMapAnswers(jobId);
                    }
                  }}
                  className="px-6 py-2 bg-veda-dark text-white rounded-lg hover:bg-veda-gray-800 transition"
                >
                  {failedStep === "answers" ? "Retry Answer Extraction" : 
                   failedStep === "mapping" ? "Retry Mapping & Grading" : 
                   "Retry Extraction"}
                </button>
              </div>
            )}
          </main>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SCREEN 3: Results (Phase 6 Results Layout) */}
        {/* ═══════════════════════════════════════════ */}
        {screen === "results" && assessmentResults && jobId && (
          <main className="flex-1 flex overflow-hidden relative">
            <ResultsLayout 
              results={assessmentResults}
              onUpdateMapping={handleUpdateMapping}
            />
          </main>
        )}
      </div>
    </div>
  );
}
