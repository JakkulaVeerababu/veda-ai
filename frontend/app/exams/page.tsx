'use client';
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uploadAndProcess, pollUntilComplete, extractQuestions, extractAnswers, mapAnswers, gradeAnswers, getAnswerPageUrl, getAssessmentResults } from "@/lib/api";
import { AssessmentResults, Question as ApiQuestion } from "@/lib/types";

type Stage = "upload" | "loading" | "mapping";
type MobilePane = "questions" | "answer";
type UploadKind = "question" | "answer";

type Question = {
  id: string;
  label: string;
  text: string;
  score: string;
  tone: "good" | "warn" | "bad";
  feedback?: string;
};

const A = "/assets/";

const questions: Question[] = [
  { id: "q1", label: "1", text: "Which blood vessel carries blood away from the heart?", score: "2 / 2", tone: "good" },
  {
    id: "q2",
    label: "2",
    text: "Which of the following organelles is primarily involved in photosynthesis?",
    score: "2 / 2",
    tone: "good",
    feedback: "Excellent work! You correctly identified the chloroplast as the organelle responsible for photosynthesis. Keep it up!",
  },
  { id: "q3", label: "3", text: "Explain the role of chloroplasts in photosynthesis, naming the main pigments involved and briefly outlining the two major stages of the process.", score: "2 / 2", tone: "good" },
  { id: "q4", label: "4", text: "Describe the flow of blood through the human heart starting from the right atrium and ending at the aorta; include the names of valves crossed.", score: "0 / 2", tone: "bad" },
  { id: "q5", label: "5", text: "Draw a labelled diagram of an alveolus showing capillaries and air space (label alveolar sac, capillary, and direction of gas exchange).", score: "2 / 2", tone: "good" },
  { id: "q6", label: "6", text: "Draw a neat labelled diagram of the human digestive system (stomach, small intestine, large intestine, liver, pancreas) and label the site where most absorption occurs.", score: "4 / 5", tone: "good" },
  { id: "q7", label: "7", text: "Draw and label a nephron (Bowman's capsule, glomerulus, proximal tubule, loop of Henle, distal tubule, collecting duct).", score: "5 / 5", tone: "good" },
  { id: "q8", label: "8", text: "Explain the structural differences between palisade mesophyll and spongy mesophyll and state how each structure aids its function in the leaf.", score: "3 / 5", tone: "warn" },
  { id: "q9", label: "9", text: "Describe the process of transpiration in plants in two to three sentences and name two environmental factors that increase its rate.", score: "5 / 5", tone: "good" },
  { id: "q10", label: "10", text: "Explain how the structure of xylem vessels facilitates water transport in plants (mention one structural feature and its role).", score: "4 / 5", tone: "good" },
  { id: "q11a", label: "11 · a.", text: "A diagram shows two potted plants — Plant A in bright light with broad green leaves, Plant B kept in dim light with pale, elongated leaves.", score: "2 / 2", tone: "good" },
  { id: "q11b", label: "11 · b.", text: "Suggest one practical measure to help Plant B recover.", score: "1 / 3", tone: "warn" },
  { id: "q12", label: "12", text: "A resting person has tidal volume (air per breath) of 0.5 L and breathes 12 times per minute.", score: "4 / 5", tone: "good" },
  { id: "q13", label: "13", text: "If dead space is 0.15 L per breath, calculate the alveolar ventilation per minute. Show working.", score: "4 / 5", tone: "good" },
];

const assetIcon = (name: string, alt = "") => <img className="asset-icon" src={`${A}${name}`} alt={alt} />;

function MobileChrome() {
  return (
    <div className="mobile-chrome" aria-hidden="true">
      <div className="mobile-status">
        <b>9:41</b>
        <span className="status-icons">▮▮▮ ))) ▱</span>
      </div>
      <div className="mobile-address"><span>▣</span> web-to-figma.design <span>⇧</span></div>
    </div>
  );
}

function MobileHeader({ pane, setPane, mapping }: { pane: MobilePane; setPane: (pane: MobilePane) => void; mapping: boolean }) {
  return (
    <div className={`mobile-header ${mapping ? "with-tabs" : ""}`}>
      <div className="mobile-nav">
        <div className="mobile-brand"><span className="back-glyph">←</span>{mapping && assetIcon("logo.svg", "VedaAI")}<b>VedaAI</b></div>
        <div className="mobile-actions">
          <span className="mobile-notification">{assetIcon("notification.svg", "Notifications")}</span>
          <img className="avatar" src={`${A}avatar.png`} alt="Madhur Rastogi" />
          <span className="menu-glyph">☰</span>
        </div>
      </div>
      {mapping && (
        <div className="segmented" role="tablist" aria-label="Mapping view">
          <button className={pane === "questions" ? "active" : ""} onClick={() => setPane("questions")}>Questions</button>
          <button className={pane === "answer" ? "active" : ""} onClick={() => setPane("answer")}>Answer Sheet</button>
        </div>
      )}
    </div>
  );
}

function Sidebar({ compact }: { compact: boolean }) {
  const links = [
    ["nav-home.svg", "Home"],
    ["nav-classroom.svg", "My Classroom"],
    ["nav-assignments.svg", "Assignments"],
    ["nav-exams.svg", "Exams"],
    ["nav-library.svg", "My Library"],
  ];
  return (
    <aside className={`sidebar ${compact ? "compact" : ""}`}>
      <div>
        <div className="brand-row">
          <div className="brand">{assetIcon("logo.svg", "VedaAI")} {!compact && <strong>VedaAI</strong>}</div>
          {!compact && assetIcon("sidebar-collapse.svg", "Collapse sidebar")}
        </div>
        <button className="toolkit-button">{assetIcon("toolkit.svg")} {!compact && <span>AI Teacher's Toolkit</span>}</button>
        <nav className="side-nav">
          {links.map(([icon, label]) => (
            <button className={label === "Exams" ? "selected" : ""} key={label} title={compact ? label : undefined}>
              {assetIcon(icon, label)} {!compact && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        {!compact && <button className="settings-link">{assetIcon("nav-settings.svg", "Settings")}<span>Settings</span></button>}
        <div className="school-card">
          <div className="school-mark"><img src={`${A}school.png`} alt="Delhi Public School" /></div>
          {!compact && <div><strong>Delhi Public School</strong><span>Bokaro Steel City</span></div>}
        </div>
        {compact && <span className="chevrons">»</span>}
      </div>
    </aside>
  );
}

function Topbar({ compact }: { compact: boolean }) {
  return (
    <header className={`topbar ${compact ? "compact-offset" : ""}`}>
      <div className="crumb"><span className="top-back">←</span>{assetIcon("breadcrumb.svg")}<span>Exams</span></div>
      <div className="top-actions">
        <span className="help">?</span>
        <span className="notify">{assetIcon("notification.svg", "Notifications")}</span>
        <span className="sparkle-chip">{assetIcon("sparkle.svg", "AI tools")}</span>
        <img className="avatar" src={`${A}avatar.png`} alt="Madhur Rastogi" />
        <b>Madhur Rastogi</b><span>⌄</span>
      </div>
    </header>
  );
}

function OrbitTeacher() {
  return (
    <div className="orbit-teacher" aria-label="VedaAI teacher assistant">
      <span className="orbit orbit-one" />
      <span className="orbit orbit-two" />
      <img src={`${A}teacher.png`} alt="VedaAI teacher assistant" />
      <span className="orbit-dot d1">⚙</span>
      <span className="orbit-dot d2">⌁</span>
      <span className="orbit-dot d3">◷</span>
      <span className="orbit-dot d4">☑</span>
    </div>
  );
}

function UploadSlot({ kind, file, onSelect, onRemove }: {
  kind: UploadKind;
  file: File | null;
  onSelect: (kind: UploadKind, file: File) => void;
  onRemove: (kind: UploadKind) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const isQuestion = kind === "question";
  const sampleName = isQuestion ? "Class_10_maths_unit_test.pdf" : "student_1_answer_sheet";
  const details = isQuestion ? "2MB  ·  2 Pages" : "8MB  ·  4 Pages";
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    if (chosen) onSelect(kind, chosen);
  };
  return (
    <div className={`upload-slot ${file ? "filled" : ""}`}>
      <input ref={input} type="file" accept=".pdf,image/*" onChange={change} />
      {!file ? (
        <button onClick={() => input.current?.click()} className="upload-empty">
          <span className="upload-icon">↥</span>
          <strong>Upload <em>{isQuestion ? "Question Paper" : "Answer Sheet"}</em></strong>
          <small>Max 10MB</small>
        </button>
      ) : (
        <div className="file-pill">
          <div className="pdf-thumb"><img src={`${A}pdf-thumb.png`} alt="PDF" /></div>
          <div><strong>{file.name || sampleName}</strong><small>{details}</small></div>
          <button className="remove-file" onClick={() => onRemove(kind)} aria-label={`Remove ${kind} file`}>×</button>
        </div>
      )}
    </div>
  );
}

function UploadScreen({ questionFile, answerFile, onSelect, onRemove, onStart }: {
  questionFile: File | null;
  answerFile: File | null;
  onSelect: (kind: UploadKind, file: File) => void;
  onRemove: (kind: UploadKind) => void;
  onStart: () => void;
}) {
  const ready = Boolean(questionFile && answerFile);
  return (
    <main className="upload-screen">
      <div className="soft-glow glow-a" /><div className="soft-glow glow-b" />
      <section className="upload-content">
        <div className="upload-heading">
          <h1><span>Upload</span> <mark>Question Paper &amp; Answer Sheets</mark></h1>
          <p>Upload both files to get started</p>
        </div>
        <OrbitTeacher />
        <div className="upload-panel">
          <UploadSlot kind="question" file={questionFile} onSelect={onSelect} onRemove={onRemove} />
          <UploadSlot kind="answer" file={answerFile} onSelect={onSelect} onRemove={onRemove} />
        </div>
        <div className="start-wrap">
          <button className="primary-pill" disabled={!ready} onClick={onStart}>Start Mapping <span>→</span></button>
          <p>Once both files are uploaded, you’ll able to map answers with questions</p>
        </div>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <section className="loading-card" aria-live="polite">
        <div className="loader-art">
          <img className="loader-large" src={`${A}loader-large.svg`} alt="" />
          <img className="loader-medium" src={`${A}loader-medium.svg`} alt="" />
          <img className="loader-small" src={`${A}loader-small.svg`} alt="" />
          <img className="loader-dot" src={`${A}loader-dot.svg`} alt="" />
        </div>
        <h2>Extracting...</h2>
        <p>This may take a while</p>
      </section>
    </main>
  );
}

function QuestionCard({ question, open, onToggle }: { question: Question; open: boolean; onToggle: () => void }) {
  return (
    <article className={`question-card ${open ? "open" : ""}`}>
      <button className="question-summary" onClick={onToggle} aria-expanded={open}>
        <span className="question-number">{question.label}</span>
        <span className="question-text">{question.text}</span>
        <span className={`score ${question.tone}`}>{question.score}</span>
        <span className="toggle-icon">{open ? "⌃" : "⌄"}</span>
      </button>
      {open && (
        <div className="feedback">
          <strong>AI Feedback</strong>
          <p>{question.feedback || "The response is mapped to the highlighted section of the answer sheet. Review the score and feedback before publishing."}</p>
        </div>
      )}
    </article>
  );
}

function QuestionsPanel({ items, open, setOpen, toggleAll, allOpen }: { items: Question[]; open: Set<string>; setOpen: any; toggleAll: () => void; allOpen: boolean }) {
  const data = items.length > 0 ? items : questions;
  return (
    <section className="questions-panel">
      <div className="questions-title"><strong>Extracted Questions (from question paper)</strong><button onClick={toggleAll}>{allOpen ? "Collapse All" : "Expand All"}</button></div>
      <div className="question-list">
        {data.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            open={open.has(question.id)}
            onToggle={() => setOpen((current: Set<string>) => {
              const next = new Set(current);
              next.has(question.id) ? next.delete(question.id) : next.add(question.id);
              return next;
            })}
          />
        ))}
      </div>
    </section>
  );
}

function AnswerViewer({ jobId, pageCount, regions }: { jobId: string | null; pageCount: number; regions: any[] }) {
  const totalPages = pageCount || 4;
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const zoomBy = (amount: number) => setZoom((value) => Math.min(140, Math.max(70, value + amount)));
  const pageBy = (amount: number) => setPage((value) => Math.min(totalPages, Math.max(1, value + amount)));
  return (
    <section className="answer-viewer">
      <div className="answer-toolbar">
        <strong>Answer Sheet</strong>
        <div className="viewer-controls">
          <div><button onClick={() => zoomBy(-10)}>−</button><b>{zoom}%</b><button onClick={() => zoomBy(10)}>+</button></div>
          <div><button onClick={() => pageBy(-1)}>‹</button><b>Page {page} of {totalPages}</b><button onClick={() => pageBy(1)}>›</button></div>
        </div>
      </div>
      <div className="paper-scroll">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageRegions = regions.filter(r => r.page === index + 1);
          return (
            <div className="paper-page" key={index} style={{ width: `${zoom}%` }}>
              <img src={jobId ? getAnswerPageUrl(jobId, index + 1) : `${A}answer-sheet.png`} alt={`Answer sheet page ${index + 1}`} />
              {pageRegions.length > 0 ? pageRegions.map((r, i) => (
                <div key={i} className="answer-highlight" style={{
                  position: 'absolute',
                  left: `${r.x * 100}%`,
                  top: `${r.y * 100}%`,
                  width: `${r.width * 100}%`,
                  height: `${r.height * 100}%`,
                  right: 'auto'
                }}>
                  <span>{r.label || "Answer"}</span>
                </div>
              )) : !jobId && (
                <div className="answer-highlight"><span>Q2</span></div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MappingScreen({ pane, items, jobId, pageCount, results }: { pane: MobilePane; items: Question[]; jobId: string | null; pageCount: number; results: AssessmentResults | null }) {
  const data = items.length > 0 ? items : questions;
  const [open, setOpen] = useState<Set<string>>(new Set(data.length > 0 ? [data[0].id] : []));
  const allOpen = open.size === data.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(data.map((question) => question.id)));

  // Calculate dynamic regions based on open questions
  const activeRegions = useMemo(() => {
    if (!results) return [];
    const regions: any[] = [];
    for (const qId of open) {
      const q = results.questions.find(q => q.id === qId);
      const label = q ? (q.number || String(q.order)) : "Q";
      const mapping = results.mappings.find(m => m.questionId === qId);
      if (mapping && mapping.answerIds) {
        for (const aId of mapping.answerIds) {
          const ans = results.answers.find(a => a.answerId === aId);
          if (ans && ans.regions) {
            ans.regions.forEach(r => regions.push({ ...r, label }));
          }
        }
      }
    }
    return regions;
  }, [open, results]);

  return (
    <main className="mapping-screen">
      <div className={`mapping-column questions-view ${pane === "questions" ? "mobile-active" : ""}`}>
        <QuestionsPanel items={items} open={open} setOpen={setOpen} toggleAll={toggleAll} allOpen={allOpen} />
      </div>
      <div className={`mapping-column answer-view ${pane === "answer" ? "mobile-active" : ""}`}>
        <AnswerViewer jobId={jobId} pageCount={pageCount} regions={activeRegions} />
      </div>
    </main>
  );
}

function sampleFile(name: string) {
  return new File(["VedaAI sample"], name, { type: "application/pdf" });
}

export default function App() {
  const requested = useMemo(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("screen") : null, []);
  const initialFilled = requested === "filled" || requested === "loading" || requested === "mapping";
  const [stage, setStage] = useState<Stage>(requested === "loading" ? "loading" : requested === "mapping" ? "mapping" : "upload");
  const [pane, setPane] = useState<MobilePane>("questions");
  const [questionFile, setQuestionFile] = useState<File | null>(initialFilled ? sampleFile("Class_10_maths_unit_test.pdf") : null);
  const [answerFile, setAnswerFile] = useState<File | null>(initialFilled ? sampleFile("student_1_answer_sheet.pdf") : null);

  // Backend state
  const [jobId, setJobId] = useState<string | null>(null);
  const [realQuestions, setRealQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [answerPageCount, setAnswerPageCount] = useState(4);
  const [error, setError] = useState<string | null>(null);

  const runPipeline = useCallback(async (qFile: File, aFile: File) => {
    try {
      setError(null);
      // Step 1: Upload files
      const taskId = await uploadAndProcess(qFile, aFile);

      // Step 2: Poll until document preparation is complete
      const finalStatus = await pollUntilComplete(taskId, () => {});
      const jid = (finalStatus as any).result?.jobId;
      if (!jid) throw new Error("No jobId returned from processing");
      setJobId(jid);

      // Step 3: Extract questions
      const qResult = await extractQuestions(jid);

      // Step 4: Extract answers
      const aResult = await extractAnswers(jid);
      setAnswerPageCount(aResult.totalPages || 4);

      // Step 5: Map answers to questions
      await mapAnswers(jid);

      // Step 6: Grade
      await gradeAnswers(jid);

      // Step 7: Get full results for regions and display
      const fullResults = await getAssessmentResults(jid);
      setResults(fullResults);

      // Build Question[] for the UI from extracted questions + grades
      const gradeMap = new Map<string, any>();
      if (Array.isArray(fullResults.grades)) {
        fullResults.grades.forEach((g: any) => gradeMap.set(g.questionId, g));
      }

      const built: Question[] = (fullResults.questions || []).map((q: any) => {
        const g = gradeMap.get(q.id);
        const score = g?.score ?? 0;
        const maxScore = g?.maxScore ?? q.marks ?? 0;
        const ratio = maxScore > 0 ? score / maxScore : 0;
        const tone: "good" | "warn" | "bad" = ratio >= 0.8 ? "good" : ratio >= 0.4 ? "warn" : "bad";
        return {
          id: q.id,
          label: q.number || String(q.order),
          text: q.text,
          score: `${score} / ${maxScore}`,
          tone,
          feedback: g?.feedback || undefined,
        };
      });

      setRealQuestions(built);
      setStage("mapping");
    } catch (err: any) {
      console.error("Pipeline error:", err);
      setError(err.message || "Something went wrong");
      setStage("upload");
    }
  }, []);

  const handleStart = useCallback(() => {
    if (!questionFile || !answerFile) return;
    setStage("loading");
    runPipeline(questionFile, answerFile);
  }, [questionFile, answerFile, runPipeline]);

  const compact = stage !== "upload";
  const onSelect = (kind: UploadKind, file: File) => kind === "question" ? setQuestionFile(file) : setAnswerFile(file);
  const onRemove = (kind: UploadKind) => kind === "question" ? setQuestionFile(null) : setAnswerFile(null);

  return (
    <div className={`app stage-${stage} ${compact ? "compact-shell" : "expanded-shell"}`}>
      <MobileChrome />
      <MobileHeader pane={pane} setPane={setPane} mapping={stage === "mapping"} />
      <Sidebar compact={compact} />
      <Topbar compact={compact} />
      <div className="app-content">
        {stage === "upload" && <UploadScreen questionFile={questionFile} answerFile={answerFile} onSelect={onSelect} onRemove={onRemove} onStart={handleStart} />}
        {stage === "loading" && <LoadingScreen />}
        {stage === "mapping" && <MappingScreen pane={pane} items={realQuestions} jobId={jobId} pageCount={answerPageCount} results={results} />}
      </div>
      {error && <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:"#c0350a",color:"white",padding:"12px 24px",borderRadius:12,zIndex:9999,fontSize:14}}>{error}<button onClick={()=>setError(null)} style={{marginLeft:12,background:"transparent",color:"white",border:"1px solid white",borderRadius:8,padding:"2px 8px",cursor:"pointer"}}>✕</button></div>}
    </div>
  );
}

