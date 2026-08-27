# Final Submission Content

**Live URL:**
<actual URL>

**GitHub:**
<actual URL>

**Approach:**
The application converts uploaded question papers and handwritten answer sheets into page images. A multimodal AI model extracts structured questions and handwritten answer blocks with normalized bounding regions. A mapping layer combines deterministic label matching with semantic matching to associate answers with questions, gracefully handling out-of-order and unnumbered responses. The frontend renders answer-sheet pages with coordinate-based overlays so selecting a question highlights the exact corresponding handwritten answer. Optional AI-assisted grading provides marks and feedback.

**AI Model/API:**
Google Gemini API (gemini-3.6-flash)

**Assumptions / Limitations:**
- One student answer sheet is processed at a time.
- Documents must be PDF, JPG, or PNG.
- Extremely poor handwriting can lower OCR and mapping accuracy.
- Very short unnumbered answers may require manual review.
- AI-generated grading is assistive and should be reviewed by teachers.
