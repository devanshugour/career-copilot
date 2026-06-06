# API Reference

REST endpoints exposed by Career Copilot. All routes are Next.js 16 Route Handlers under `src/app/api/*`. Authentication is enforced by `proxy.ts` (RBAC) + per-route `auth()` checks.

---

## Authentication

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` | `{ userId }` | Creates a USER. Validates with Zod, hashes password with bcryptjs (10 rounds). |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth-controlled | session cookie | Catch-all for the credentials provider. `POST /api/auth/callback/credentials` is the login endpoint. |
| `POST` | `/api/auth/signout` | — | redirect | NextAuth default — clears session cookie. |

**Register payload schema** (`registerSchema` in `services/auth/register.ts`):
```ts
{
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
}
```

---

## Jobs

| Method | Path | Auth | Query / Body | Response |
|---|---|---|---|---|
| `GET` | `/api/jobs` | USER | `q, workMode, jobType, level, sort, page, pageSize` | `{ items, total, page, pageSize, totalPages }` |
| `GET` | `/api/jobs/:id` | USER | — | Full Job + Company + JobSkill rows |
| `GET` | `/api/jobs/recommended` | USER | — | `{ items: { job, match }[] }` (top 4 ranked vs resume) |
| `POST` | `/api/jobs/saved` | USER | `{ jobId }` | `{ saved: boolean }` (toggle) |
| `POST` | `/api/jobs/apply` | USER | `{ jobId }` | `{ application }` (upsert with APPLIED status) |
| `GET` | `/api/jobs/:id/match` | USER | — | `{ guide, cached, resumeId, jobId } \| { guide: null }` (cache probe; no AI) |
| `POST` | `/api/jobs/:id/match` | USER | — (or `?force=1`) | `{ guide, cached, resumeId, jobId }` (AI-builds if uncached) |

### `GET /api/jobs` — query parameters

| Param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | — | Searches title / description / location / company / skill name (case-insensitive). |
| `workMode` | `ONSITE \| HYBRID \| REMOTE \| ALL` | `ALL` | |
| `jobType` | `FULL_TIME \| PART_TIME \| CONTRACT \| INTERNSHIP \| ALL` | `ALL` | |
| `level` | `ENTRY \| JUNIOR \| MID \| SENIOR \| LEAD \| ALL` | `ALL` | |
| `sort` | `match \| recent \| salary` | `match` if resume; else `recent` | "match" pools more jobs server-side, scores in memory, then paginates. |
| `page` | int | 1 | 1-indexed. |
| `pageSize` | int | 12 | Capped at 50. |

### `POST /api/jobs/:id/match` — the head-to-head endpoint

The most expensive endpoint. Sonnet 4.6 call (~30s) on first invocation; instant on re-views due to `AIAnalysis` cache keyed on `(userId, jobId, resumeId)`.

**Response shape** (Zod schema `ApplicationGuideSchema` in `types/analysis.ts`):
```ts
{
  matchPercentage: 0..100,
  verdict: "strong" | "good" | "stretch" | "long_shot",
  readinessAssessment: string,           // 2-4 sentences, references resume bullets
  pros: string[],                         // 3-5, each tied to a resume signal
  cons: string[],                         // 2-4, honest risks
  matchedSkills: string[],
  missingSkills: string[],
  skillsToLearn: {
    skill: string;
    priority: "high" | "medium" | "low";
    durationWeeks: 1..52;
    resources: string[];                  // course titles, doc URLs, project ideas
  }[],
  practiceTips: string[],                 // 3-5 actionable in 2-4 weeks
  coverLetterEmail: string,               // subject + body, ready to send
}
```

`?force=1` skips the cache and forces a fresh AI call (used by the "Re-run" button in the UI).

---

## Resume

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/resume/upload` | USER | `multipart/form-data` with `file` (PDF, ≤ 5 MB) | `{ resumeId, profile }` |
| `GET` | `/api/resume/me` | USER | — | `{ resume }` (with skills + parsedProfile) or `{ resume: null }` |

### `POST /api/resume/upload` — error codes

| Code | Cause |
|---|---|
| 400 | No file in multipart payload |
| 413 | File larger than 5 MB |
| 415 | Not `application/pdf` |
| 502 | Claude error (rate-limit, auth, refusal) — error message in body |

The PDF buffer is sent directly to Claude Sonnet as a `document` content block. Returns the parsed `ResumeProfile`. Side effects:
- Deactivates the user's previous active resume.
- Creates a new `Resume` row + `ResumeSkill` rows (normalizing into the `Skill` catalog).
- Logs an `AIAnalysis` row with `kind: RESUME_PARSE`.

---

## Career

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/career/analyze` | USER | `{ jobTitle?, jobDescription }` | `JdAnalysis` |
| `POST` | `/api/career/readiness` | USER | — | `CareerReport` row |

### `POST /api/career/analyze`

Pastes-a-JD analyzer. Pulls the user's active resume, sends both to Claude Sonnet.

**Response shape** (`JdAnalysisSchema`):
```ts
{
  matchPercentage: 0..100,
  atsScore: 0..100,
  matchedSkills: string[],
  missingSkills: string[],
  resumeOptimizations: string[],   // cite the candidate's actual bullets
  improvements: string[],           // concrete, personalized actions
  learningRoadmap: { skill, priority, durationWeeks, resources }[],
  verdict: string,                  // 1-2 sentences for this candidate
}
```

### `POST /api/career/readiness`

Aggregates the latest resume + the latest JD analysis (if any) into a five-axis readiness scorecard. Persists as a `CareerReport`.

**Response shape** (`CareerReadinessSchema`):
```ts
{
  careerScore: 0..100,
  employabilityScore: 0..100,
  atsReadiness: 0..100,
  interviewReadiness: 0..100,
  skillReadiness: 0..100,
  improvementPlan: string[],
  actionItems: string[],
  recommendations: string[],
}
```

---

## Interview

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/api/interview/generate` | USER | `{ jobId?, jobTitle?, jdSnippet?, count? (3..10) }` | `InterviewSession` with `questions[]` |
| `POST` | `/api/interview/evaluate` | USER | `{ questionId, answer }` | `InterviewAnswer` with scores + feedback |

### `POST /api/interview/generate`

Creates an `InterviewSession` + `InterviewQuestion` rows. Questions are mixed across types (TECHNICAL / HR / BEHAVIORAL / SCENARIO) and personalized to the candidate's resume + target role.

### `POST /api/interview/evaluate`

Scores one answer on four axes; upserts the `InterviewAnswer` row; recomputes the parent session's `overallScore` (running average); promotes session to `completed` when all questions are answered.

**Response shape** (`InterviewEvaluationSchema`):
```ts
{
  score: 0..100,                  // overall
  accuracy: 0..100,
  communication: 0..100,
  completeness: 0..100,
  relevance: 0..100,
  strengths: string[],            // quote actual answer content
  weaknesses: string[],
  suggestedAnswer: string,        // 5-8 sentence model answer
}
```

---

## Error envelope

All endpoints return `{ error: string }` with an appropriate HTTP status on failure. Specifically:

| Status | When |
|---|---|
| 400 | Invalid request body / missing required field |
| 401 | Unauthenticated (proxy.ts catches most; route handlers double-check via `auth()`) |
| 403 | Authenticated but lacks permission (e.g., admin route as USER) |
| 404 | Resource not found |
| 413 | Payload too large (resume upload > 5 MB) |
| 415 | Unsupported media type (non-PDF resume) |
| 422 | AI couldn't extract anything useful from input (PDF was blank, etc.) |
| 502 | Upstream AI provider error (rate-limit, refusal, transport) — message includes Anthropic-side detail |

---

## Authentication / cookie

The session lives in an `authjs.session-token` cookie (httpOnly, secure, sameSite=lax). JWT strategy — the cookie *is* the session; no DB lookup per request. `auth()` decodes it server-side.

For programmatic API calls (e.g., from a future native app):
1. `POST /api/auth/csrf` → get `csrfToken`
2. `POST /api/auth/callback/credentials` with `csrfToken=<token>&email=...&password=...&json=true&redirect=false`
3. Capture `Set-Cookie` headers.
4. Send the cookie on subsequent requests.

This is what the smoke tests in `scripts/` (now removed) used.

---

## What's not in the API surface

These features run entirely server-side via React Server Components — no public REST endpoint:

- Job listing rendering (the `/jobs` page reads `jobsRepo.list()` directly).
- Resume profile display.
- Dashboard activity strip.
- Admin tables.

If you need a programmatic equivalent for any of these, the underlying repository functions in `services/*/repository.ts` are stable and well-typed; wrapping them in a route handler is mechanical.
