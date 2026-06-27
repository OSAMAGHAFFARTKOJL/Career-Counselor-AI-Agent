# Career Counselor Multi-Agent Studio

Career Counselor Multi-Agent Studio is a hackathon-ready web app for confused or first-time career seekers.
It recreates a counselor-like flow:

1. Ask what role the user thinks they can become.
2. Parse resume evidence (PDF/DOCX/TXT) when available.
3. Generate adaptive follow-up questions based on latest answers.
4. Challenge contradictions and test alternate field hypotheses.
5. End automatically when confidence is high (max 20 turns).
6. Return final recommendations plus an improvement roadmap.

## Core Use Case

Students and early professionals often choose roles based on hype, not fit.
This product helps them decide with a structured, explainable, and practical process.

## Multi-Agent Architecture

- `Interview Agent`: Converts MCQ answers into trait signals and archetype.
- `Resume Evidence Agent`: Detects strengths from resume/project text.
- `Reality Check Agent`: Surfaces blind spots and challenge questions.
- `Career Match Agent`: Ranks roles and generates a 14-day validation sprint.

The interview is model-driven and adaptive:
- each next question is generated from dream role + resume + answer history,
- can switch to counter-questions when evidence conflicts with aspiration,
- explores alternative fields when new signals emerge,
- ends automatically based on confidence, with hard cap 20 questions.

## Stack

- Next.js 15 App Router
- React + TypeScript
- Tailwind CSS
- Groq/Gemini integration for optional narrative synthesis

## Run Locally

1. Install dependencies:
   - `npm install`
2. Create `.env.local`:
   - `AI_PROVIDER=groq`
   - `GROQ_API_KEY=...` (optional but recommended)
   - `GEMINI_API_KEY=...` (optional)
3. Start the app:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

## Main API

- `POST /api/counselor/resume`
  - Input: form-data `file` (`.pdf`, `.docx`, `.txt`)
  - Output: extracted resume text for evidence-aware analysis

- `POST /api/counselor/adaptive`
  - Input: `dreamRole`, optional `resumeText`, `history` turns
  - Output: either `nextQuestion` or `finalReport` with roadmap

