(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * API client for the VedaAI Assessment backend.
 */ __turbopack_context__.s([
    "API_BASE_URL",
    ()=>API_BASE_URL,
    "extractAnswers",
    ()=>extractAnswers,
    "extractQuestions",
    ()=>extractQuestions,
    "getAnswerPageUrl",
    ()=>getAnswerPageUrl,
    "getAssessmentResults",
    ()=>getAssessmentResults,
    "getResult",
    ()=>getResult,
    "gradeAnswers",
    ()=>gradeAnswers,
    "mapAnswers",
    ()=>mapAnswers,
    "pollStatus",
    ()=>pollStatus,
    "pollUntilComplete",
    ()=>pollUntilComplete,
    "updateMapping",
    ()=>updateMapping,
    "uploadAndProcess",
    ()=>uploadAndProcess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE_URL = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace("localhost", "127.0.0.1");
async function uploadAndProcess(questionPaper, answerSheet) {
    const formData = new FormData();
    formData.append("question_paper", questionPaper);
    formData.append("answer_sheet", answerSheet);
    const res = await fetch(`${API_BASE_URL}/api/process`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Upload failed"
            }));
        throw new Error(err.detail || "Failed to upload files");
    }
    const data = await res.json();
    return data.taskId;
}
async function pollStatus(taskId) {
    const res = await fetch(`${API_BASE_URL}/api/status/${taskId}`);
    if (!res.ok) {
        throw new Error("Failed to fetch status");
    }
    return res.json();
}
async function getResult(taskId) {
    const res = await fetch(`${API_BASE_URL}/api/status/${taskId}`);
    if (!res.ok) {
        throw new Error("Failed to fetch result");
    }
    return res.json();
}
async function pollUntilComplete(taskId, onProgress, intervalMs = 2000) {
    return new Promise((resolve, reject)=>{
        const poll = async ()=>{
            try {
                const status = await pollStatus(taskId);
                onProgress(status);
                if (status.status === "completed") {
                    resolve(status);
                    return;
                }
                if (status.status === "error") {
                    reject(new Error(status.error || "Processing failed"));
                    return;
                }
                setTimeout(poll, intervalMs);
            } catch (err) {
                reject(err);
            }
        };
        poll();
    });
}
async function extractQuestions(jobId, force = false) {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/extract-questions?force=${force}`, {
        method: "POST"
    });
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Extraction failed"
            }));
        throw new Error(err.detail || "Failed to extract questions");
    }
    return res.json();
}
async function extractAnswers(jobId, force = false) {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/extract-answers?force=${force}`, {
        method: "POST"
    });
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Answer extraction failed"
            }));
        throw new Error(err.detail || "Failed to extract answers");
    }
    return res.json();
}
async function mapAnswers(jobId, force = false) {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/map-answers?force=${force}`, {
        method: "POST"
    });
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Answer mapping failed"
            }));
        throw new Error(err.detail || "Failed to map answers");
    }
    return res.json();
}
async function gradeAnswers(jobId, force = false) {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/grade?force=${force}`, {
        method: "POST"
    });
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Answer grading failed"
            }));
        throw new Error(err.detail || "Failed to grade answers");
    }
    return res.json();
}
function getAnswerPageUrl(jobId, page) {
    return `${API_BASE_URL}/api/jobs/${jobId}/answer/pages/${page}`;
}
async function getAssessmentResults(jobId) {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/results`);
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Failed to load results"
            }));
        throw new Error(err.detail || "Failed to load results");
    }
    return res.json();
}
async function updateMapping(jobId, questionId, answerId) {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/mappings/${questionId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            answerId
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(()=>({
                detail: "Failed to update mapping"
            }));
        throw new Error(err.detail || "Failed to update mapping");
    }
    return res.json();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=lib_api_ts_0w7yr1a._.js.map