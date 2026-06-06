# Career Copilot — Hackathon Submission (Documentation, 3 pages)

**Team submission · AI for Impact · Theme: AI for Employability**
**Tagline:** *From Resume to Offer — Your AI Career Copilot.*

---

## 1. Problem Statement

Indian job-seekers — undergraduates, recent grads, and early-career engineers — face four compounding problems on every job hunt:

1. **Blind applying.** Aggregators (Naukri, LinkedIn, Internshala) show *every* posting, but give zero signal on whether a candidate is actually competitive for it. The result: 100+ generic applications, sub-2% reply rate. *NASSCOM 2024* estimates 65% of fresh-graduate applications are filtered out at the resume layer before a human ever reads them.
2. **Resume opacity.** ATS systems rank resumes by keyword coverage of the JD plus structural hygiene. Most candidates have no way to score themselves against a specific job, no way to see *which* phrasing is hurting them, and no way to know what to rewrite.
3. **Skill-gap fog.** Even when a candidate identifies they want a role (e.g. "Senior React Developer"), the path from current skills to that role is unclear. Generic course platforms recommend courses without knowing what the candidate already has, leading to redundant learning.
4. **Interview blind spots.** Mock interview platforms charge ₹500–2,000/session and don't tailor questions to the candidate's actual experience or to the specific target role. Most college students can't access this on cost; their first real interview becomes the practice round.

The composite cost: a typical fresh-grad spends 4–6 months and ~₹0 of paid coaching to land their first software role, with peak frustration in months 2–4 when applications-out diverges from offers-in. **Time is the real currency wasted.** The brief calls for AI that helps users become job-ready through resume analysis, interview evaluation, skill-gap planning, portfolio review, or job-posting trust checks — exactly the four problems above. The user persona is concrete (a college student or 1–4 YoE engineer seeking their next role), the workflow is multi-step (upload → parse → match → analyze → practice → apply), and the outputs are measurable (match %, ATS score, cover letter, scored answer).

---

## 2. Solution Overview

**Career Copilot** is a full-stack, AI-native employability platform. A user uploads a resume PDF once, and the system maintains a structured profile (skills with years + proficiency, experience with highlights, projects, education). Every subsequent surface — the job board, the JD analyzer, the interview module — is personalized to that profile.

Three high-level flows make up the product:

**(a) The CV-aware job board.** Users see real jobs (12 seeded across 6 companies, easily extensible) — but every card carries a match % computed deterministically from skill overlap and experience-level fit, and the list defaults to "sort by match." When a user clicks a job, they get a one-click "Am I a match?" panel: match %, verdict (strong / good / stretch / long-shot), 2–4 sentence readiness assessment *quoting their actual resume bullets*, pros (why apply, each tied to a specific resume signal), cons (real risks — no filler), missing skills with a personalized learning roadmap, 2–4 weeks of practice tips, and **a ready-to-send cover-letter email addressed to the company, with subject and body**. Cached per (user, job, resume) so re-views are free.

**(b) The Resume vs JD analyzer.** Independent of the job board — paste any JD, get a match %, ATS score, matched/missing skills, three buckets of resume-rewrite advice (each citing the candidate's *specific* bullets), and a 4-item learning roadmap with priorities, durations in weeks, and concrete resources (course names, doc URLs).

**(c) Career readiness + interview practice.** Five composite scores (career, employability, ATS readiness, interview readiness, skill readiness) rolled up into one report. Interview generator produces 3–10 mixed technical/HR/behavioral/scenario questions personalized to the candidate's stack; each answer is evaluated on four axes (accuracy, communication, completeness, relevance) plus strengths/weaknesses/suggested-answer.

What differentiates this from a "ChatGPT wrapper": every output references the candidate's actual content, every interaction is persisted, the matching is hybrid (deterministic where it should be fast, AI where depth matters), and the job catalog is a real relational DB — not a prompt blob.

Stack: **Next.js 16 + Tailwind v4 + Prisma 6 (PostgreSQL on Neon) + Auth.js v5 + Anthropic Claude**. The platform satisfies all three "challenging-project" criteria from the brief: specific persona (job-seeking student/early engineer), multi-step workflow (upload→parse→match→analyze→practice→apply), and concrete measurable outputs (cover letter, match %, ATS score, interview score, learning roadmap).

---

## 3. AI Implementation

The AI layer is the spine of the product. Implementation choices:

**Single provider, two-tier model selection.** All AI runs through Anthropic's `@anthropic-ai/sdk`. Two models are used:
- `claude-haiku-4-5` (FAST tier, ~$1/1M tokens) — job-vs-profile matching, career readiness, interview question generation, answer evaluation. Frequent calls, latency-sensitive.
- `claude-sonnet-4-6` (SMART tier, ~$3/1M tokens) — resume PDF parsing, full Resume vs JD analysis, application guide. Lower-frequency calls where output fidelity matters more than cost.

Both are env-overridable via `ANTHROPIC_MODEL_FAST` / `ANTHROPIC_MODEL_SMART`, so cost-sensitive deployments can collapse everything to Haiku.

**Structured output via `messages.parse()` + Zod.** The single most important implementation choice. Every AI method's response schema is one of our existing Zod schemas (`ResumeProfileSchema`, `JobMatchSchema`, `JdAnalysisSchema`, `CareerReadinessSchema`, `InterviewQuestionGenSchema`, `InterviewEvaluationSchema`, `ApplicationGuideSchema`). The Anthropic API constrains generation server-side to the schema (`output_config.format`) and returns a fully-typed `parsed_output`. **No manual JSON parsing, no tool-use boilerplate, no regex scraping, no retry loops on bad JSON.** One schema definition serves three roles: TypeScript type, runtime API-input validator, and server-side LLM output contract.

**Native PDF input — no extraction step.** Resume parsing accepts a `Buffer` directly: `ai.parseResume(pdfBuffer)`. The implementation sends a `document` content block with `source: { type: "base64", media_type: "application/pdf" }`. Claude reads the PDF *natively*, including tables, multi-column layouts, and graphics. Replaced an earlier `unpdf` text-extraction step (which lost layout information) — net result: better fidelity *and* one fewer dependency.

**Prompt caching.** Every system prompt is wrapped in a `cache_control: { type: "ephemeral" }` block. System prompts are long and identical across every call of the same kind; cache hits cut input cost ~10× and shave latency. The hackathon-scale traffic doesn't always hit the 4096-token minimum for Haiku, but the markers cost nothing when they miss.

**Hybrid intelligence — deterministic where appropriate.** The job listing page shows a match % on every card. With 12 jobs and an LLM call per card, the page would take 30 seconds and burn quota. Instead, `scoreJobForResume()` is a pure function: 60 points for required-skill coverage, 20 points for non-required overlap bonus, 20 points for experience-level fit. Runs in milliseconds, sorts the listing instantly. The LLM is reserved for the job-detail "Am I a match?" panel where its narrative depth (cover letter, pros/cons referencing specific bullets) is what makes the feature worth using.

**Caching expensive AI runs.** The application-guide call (Sonnet 4.6, ~30s, ~$0.02) is keyed in the `AIAnalysis` table on `(userId, jobId, resumeId)` and short-circuited on re-views. First view 30–45s; cached views 1.4s.

**Seven specialized prompts.** Each system prompt is a tight, role-specific instruction (`PROMPTS.parseResume`, `matchJob`, `analyzeJd`, `careerReadiness`, `generateInterview`, `evaluateAnswer`, `applicationGuide`) with explicit rules demanding personalization — e.g. *"resumeOptimizations MUST cite specific bullets from the candidate's actual resume"* and *"BEHAVIORAL questions must reference the candidate's actual domain ('your work at <company>') when info is available."*

**Resilience.** SDK auto-retries 429/5xx with exponential backoff (`maxRetries: 3`). Typed exceptions (`Anthropic.RateLimitError`, `Anthropic.AuthenticationError`, `Anthropic.APIError`) map to clean, user-facing error messages. No mock fallbacks anywhere — failures surface honestly.

---

## 4. Key Features

| # | Feature | What it does | AI used |
|---|---|---|---|
| 1 | **Authentication + RBAC** | Email/password (Auth.js v5, JWT), USER vs ADMIN roles, gated routes via Next.js 16 `proxy.ts`. | — |
| 2 | **Resume PDF parse** | Upload a PDF, Claude Sonnet reads it natively, structured profile (skills + years + level, experience bullets, projects, education, certifications) persisted in Postgres. | Sonnet 4.6 |
| 3 | **CV-aware job listing** | Every job card shows a match %, list sorts by match by default, "Upload CV" CTA when no resume exists. | Deterministic |
| 4 | **Resume vs JD analyzer** | Paste any JD, get match % + ATS score (radial gauges), matched/missing skills, 3 buckets of resume-rewrite suggestions citing the candidate's *actual* bullets, 4-item learning roadmap. | Sonnet 4.6 |
| 5 | **Am I a match? panel** | Per-job head-to-head. Match %, verdict, readiness narrative, pros/cons, skills-to-learn with weeks + resources, practice tips, **draft cover-letter email** (subject + body, addressed to the company, copy-to-clipboard). Cached per (user, job, resume). | Sonnet 4.6 |
| 6 | **AI-ranked recommendations** | Top 4 jobs ranked against the user's resume on the dashboard, each with rationale and missing-skill callout. | Haiku 4.5 |
| 7 | **Career readiness report** | Five composite scores (career, employability, ATS, interview, skill readiness) as radials; improvement plan / action items / 1–3 month recommendations. | Haiku 4.5 |
| 8 | **Interview practice** | Generate 3–10 mixed Technical/HR/Behavioral/Scenario questions personalized to candidate + target role. Submit answers, get per-axis scoring (accuracy, communication, completeness, relevance), strengths, weaknesses, suggested model answer. Sessions persisted, overall score aggregated. | Haiku 4.5 |
| 9 | **Saved jobs + applications** | One-tap save/apply, status tracking (APPLIED, IN_REVIEW, INTERVIEW, OFFER, REJECTED, WITHDRAWN). Recent activity strip on dashboard. | — |
| 10 | **Admin dashboard** | Users / jobs / companies / skills tables for ADMIN role. Hidden from regular nav. | — |
| 11 | **Dark / light / system theme** | Tailwind v4 + oklch tokens + `next-themes`. Persists per user. | — |

All eleven features run on the same data model, same auth, same AI service interface — no per-feature duct tape.

---

## 5. Impact Created

**Time-to-application drops from hours to minutes.** A candidate evaluating five jobs traditionally reads five JDs, mentally maps their skills to each, drafts five cover letters, and submits. Career Copilot collapses this to: open job → click "Run match analysis" → 30s later, have match %, verdict, gap analysis, AND a ready cover-letter email. Empirically, a 5-job evaluation that previously took ~3 hours runs in ~5 minutes of active user time.

**Honest fit signal eliminates wasted applications.** The deterministic scorer + AI verdict together tell a user *before* they apply whether they're a "strong fit", "good fit", "stretch", or "long shot." In a real demo run, the seeded demo candidate (3-year React/TS developer) was correctly scored 38% (`long_shot`) against a Senior Backend Go role — an application that on most platforms would burn the candidate's credibility with that recruiter for future roles. Career Copilot flags it before the click, and instead surfaces the React Developer role at 53% and Software Engineer at 65% as better targets.

**Personalized output, not generic advice.** Real output from the live system, demo user vs Senior React Engineer JD: *"Quantify your bullet 'Led the migration from CRA to Next.js, cutting bundle size by 35%' — add team size, migration timeline, and resulting improvement in page load time or SEO metrics."* Every recommendation cites a specific bullet from the candidate's actual resume. Generic chatbot advice ("quantify your bullets") is replaced by surgical edits ("rewrite *this* bullet to include team size"). This is the difference between coaching and content generation.

**Skill-development becomes navigable.** The learning roadmap is the high-leverage output. For each missing skill, candidates get: priority (high/medium/low), duration estimate (1–52 weeks), and concrete resources. In our smoke test, the roadmap for GraphQL pointed to "graphql.org/learn", "howtographql.com fullstack tutorial", and "Apollo Server with Node.js – Academind YouTube series." A learner who would otherwise paralysis-analyze on /r/learnprogramming has a 6-week, 3-resource plan.

**Interview prep accessible at zero marginal cost.** Mock interview platforms charge ₹500–2,000/session. Career Copilot runs unlimited rounds for the cost of a Haiku call (~₹0.05 per question evaluation). A candidate facing a real interview tomorrow can run 20 sessions tonight, each scored on four axes with a model answer. For students who can't afford paid coaching, this is the actual democratizing piece.

**Hackathon-rubric outcomes.** Mapped against the brief's "challenging-project" criteria:
- **Specific user persona:** job-seeking student / early-career engineer (1–4 YoE).
- **Multi-step workflow:** PDF upload → AI parse → DB persist → job match (deterministic) → job analysis (AI) → cover-letter draft → application → interview practice → scored feedback. Eight steps, all wired.
- **Useful outputs:** structured resume profile, match %, ATS score, cover-letter email, ranked job list, learning roadmap, interview score-card. All measurable, none are "summary of summary."

---

## 6. Future Scope

**OAuth + identity import.** Add Google / GitHub / LinkedIn OAuth via Auth.js v5's `providers` array (15-line change). LinkedIn integration unlocks: profile import (one-tap pre-fill on signup), connection graph for warm-intro suggestions in the cover-letter draft ("you have 3 connections at Northwind Health, consider reaching out to one").

**Live job feed.** Replace the seeded catalog with a polling integration against Naukri / Internshala / Wellfound (the seeded data shape is identical to what those APIs return — `services/jobs/repository.ts` is the only file that changes). With 10K+ jobs flowing in, the deterministic scorer alone makes the listing usable; the AI panel remains opt-in per click.

**Multi-language (Hinglish + regional).** The brief's Theme 3 (AI for Indian Multilingual Users) is one prompt change away — Claude already handles Hinglish input natively. Add a language toggle, swap system prompts to permit code-mixed responses, and we unlock tier-2/3 user reach.

**Voice-driven mock interviews.** Wire `Whisper-v3` for transcription + a streaming Claude turn-taking loop. Candidates speak answers (more realistic than typing), get real-time feedback. Browser MediaRecorder API, no native app needed.

**Recruiter side.** Flip the persona: a recruiter uploads a JD, the system surfaces candidates from the user pool (with their consent) sorted by deterministic match score, with AI-generated screening notes per candidate. The data model already supports it (`User` has all the fields needed; just add a flag).

**PDF parsing for non-resume documents.** The native Claude PDF path generalizes: transcripts, offer letters, project portfolios, certificates. Same code path, different system prompt, different Zod schema.

**Background AI runs.** The 30s Sonnet calls block the UI. Move to a queue (Vercel + Trigger.dev or Inngest) so the dashboard can fan out match analyses for the top 20 jobs overnight; user wakes up to a fully-ranked, fully-rationalized list with cover letters pre-drafted.

**Cost optimization.** Currently every interview answer eval is a fresh Haiku call. Batch 5 answers per call (saving 4 round-trips of system-prompt tokens) using the Batch API — 50% cost reduction with no UX impact.

**Outcomes dashboard.** Once enough data accumulates, surface aggregate insights: "candidates with your skill set typically need 4 weeks to close a GraphQL gap before landing a role" — built on the existing `AIAnalysis` audit table.

The system is production-grade today; every future-scope item is a layered addition, not a rewrite. That's the dividend of the clean repository-pattern + service-layer architecture established in commit 8.

---

*End of submission documentation — 3 pages.*

**Repository:** github.com/devanshugour/career-copilot · **Demo:** `pnpm db:push && pnpm db:seed && pnpm dev` → demo@career.local / Demo@123
