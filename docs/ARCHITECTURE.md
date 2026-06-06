# Architecture — Technical Deep Dive

For reviewers who want to read the code. This document explains *why* the codebase is organized the way it is, not just what's in it.

---

## High-Level Layers

```
┌───────────────────────────────────────────────────────────┐
│  App Router (Next.js 16)                                  │
│  src/app/                                                 │
│  - (auth)/   public auth pages                            │
│  - (app)/    authenticated app — gated by proxy.ts        │
│  - admin/    ADMIN-only — gated by proxy.ts               │
│  - api/      Route Handlers (REST)                        │
└─────────────────┬─────────────────────────────────────────┘
                  │  calls
┌─────────────────▼─────────────────────────────────────────┐
│  Features (src/features/*)                                │
│  UI building blocks per feature. Client components.       │
└─────────────────┬─────────────────────────────────────────┘
                  │  reads/writes via
┌─────────────────▼─────────────────────────────────────────┐
│  Services (src/services/*)                                │
│  Domain logic. Repository + Service patterns. The only    │
│  layer that talks to Prisma or to the AI provider.        │
│                                                           │
│  - auth/      NextAuth config, session helpers            │
│  - jobs/      jobs repo, scorer, recommend, app-guide     │
│  - resume/    resume repo                                 │
│  - career/    readiness builder                           │
│  - interview/ interview session service                   │
│  - ai/        AIService interface + Claude impl           │
└──────┬──────────────────────┬────────────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐         ┌──────────────────┐
│  Prisma 6   │         │  Anthropic SDK   │
│  Postgres   │         │  (Claude)        │
│  (Neon)     │         │                  │
└─────────────┘         └──────────────────┘
```

**Dependency direction:** app → features → services → providers. Never the reverse. Services never import from features or app. Features never reach into Prisma directly.

---

## Folder Layout

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # public auth pages
│   ├── (app)/                    # authenticated app
│   ├── admin/                    # ADMIN-only
│   ├── api/                      # REST route handlers
│   ├── layout.tsx                # root layout + providers
│   ├── globals.css               # Tailwind v4 + oklch tokens
│   └── page.tsx                  # public marketing landing
├── components/
│   ├── ui/                       # Shadcn-style primitives (Radix)
│   ├── common/                   # theme-toggle, data-table
│   └── layout/                   # sidebar, topbar
├── features/                     # feature-scoped UI blocks
│   ├── auth/                     # login/register forms
│   ├── jobs/                     # job-card, match-panel, etc.
│   ├── resume/                   # upload-dropzone, profile-view
│   ├── career/                   # score-radial, jd-analyzer
│   └── interview/                # start-form, session-runner
├── services/                     # domain logic
│   ├── auth/                     # Auth.js wiring
│   ├── jobs/                     # repo + scorer + recommend + guide
│   ├── resume/                   # resume repo
│   ├── career/                   # readiness builder
│   ├── interview/                # session service
│   └── ai/                       # AIService interface + Claude
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # cn, formatSalary, relativeTime, clamp
├── providers/
│   ├── app-providers.tsx         # theme + query + toaster
│   ├── theme-provider.tsx        # next-themes wrapper
│   ├── query-provider.tsx        # TanStack Query
│   └── session-provider.tsx      # NextAuth client provider
├── types/                        # shared Zod schemas + TS types
│   ├── auth.ts                   # NextAuth module augmentation
│   ├── resume.ts                 # ResumeProfile + nested
│   ├── analysis.ts               # JobMatch, JdAnalysis, etc.
│   └── jobs.ts                   # JobListItem, JobsQuery
├── hooks/
│   └── use-auth.ts               # { user, isAuthenticated, isAdmin }
└── config/
    ├── env.ts                    # Zod-validated env
    ├── routes.ts                 # ROUTES.* + PUBLIC_ROUTES
    ├── navigation.ts             # sidebar nav metadata
    └── constants.ts              # app metadata, pagination caps
prisma/
├── schema.prisma                 # full DB schema
├── seed.ts                       # seed companies/jobs/skills/users
└── migrations/                   # generated SQL
proxy.ts                          # Next.js 16 proxy (RBAC)
docs/                             # this folder
README.md
.env.example
```

---

## The Repository + Service Pattern

The two patterns together enforce that every Prisma call goes through one well-tested function.

**Repository** (`services/jobs/repository.ts`, `services/resume/repository.ts`):
- Owns *all* Prisma access for one entity.
- Pure data access — no AI calls, no business decisions.
- Returns plain objects (with relations) that domain code consumes.

**Service** (`services/jobs/recommend.ts`, `services/jobs/application-guide.ts`, `services/career/readiness.ts`, `services/interview/service.ts`):
- Composes repository calls + AI calls + business rules.
- Owns caching policy (e.g., `getCachedApplicationGuide` short-circuits before any AI call).
- Is what route handlers and Server Components ultimately call.

Route handlers and Server Components are thin: parse input, call a service, return the result. They never reach into Prisma directly.

---

## Data Model

15 models in `prisma/schema.prisma`, 7 enums. Highlights:

**User**
- Standard NextAuth shape + a `Role` enum (USER/ADMIN) + `passwordHash` for the Credentials provider.
- Has-many: resumes, savedJobs, applications, interviewSessions, aiAnalyses, careerReports.

**Company / Job / Skill / JobSkill**
- `Skill.slug` is the normalized form (lowercase, hyphenated). Used as the join key by the deterministic scorer.
- `JobSkill` has `required: boolean` and `weight: int` — currently weight is unused but reserved for weighted scoring.

**Resume**
- `rawText` is intentionally empty (we don't extract; Claude reads the PDF natively).
- `parsedProfile: Json` holds the structured profile validated by `ResumeProfileSchema`.
- `active: boolean` — exactly one active resume per user (enforced by `repository.create()` which deactivates previous active resumes in a single update).

**ResumeSkill**
- Join row with `proficiency: int(0..100)` and `years: float`. Lets the scorer compute weighted matches even when the candidate has multiple skill levels.

**AIAnalysis**
- The universal AI audit + cache table. `kind` is an enum (`RESUME_PARSE`, `RESUME_JOB_MATCH`, `RESUME_JD_ANALYZE`, `CAREER_READINESS`, `INTERVIEW_EVALUATE`). `input` and `output` are `Json`.
- Application-guide caching: `findFirst({ where: { userId, kind: "RESUME_JOB_MATCH", input: { equals: { jobId, resumeId } } } })`. This is why re-views of the same job are 1.4s instead of 45s.

**CareerReport**
- Persisted readiness scorecard. Multiple per user over time (timeline view possible).

**InterviewSession / InterviewQuestion / InterviewAnswer**
- Three-table split lets us:
  - Score each answer independently (per-axis breakdown stored on `InterviewAnswer`).
  - Aggregate `overallScore` on the session as the running average.
  - Promote session.status to "completed" when all questions are answered.

**Indexes**
- `Job (active, postedAt)` — listing query.
- `AIAnalysis (userId, kind, createdAt)` — cache lookups + audit queries.
- `Resume (userId, active)` — getActive() lookup.

---

## Auth Flow

```
Browser              proxy.ts (Edge)         Route Handler          Service       DB
  │                       │                        │                   │           │
  │── GET /dashboard ─────▶                        │                   │           │
  │                       │ auth() reads JWT       │                   │           │
  │                       │ authorized() checks    │                   │           │
  │                       │  - role for /admin     │                   │           │
  │                       │  - isAuthed for (app)/ │                   │           │
  │                       │                        │                   │           │
  │◀── redirect to /login ┤                        │                   │           │
  │   (if unauthed)       │                        │                   │           │
  │                       │                        │                   │           │
  │── POST /api/auth/callback/credentials ─────────▶                   │           │
  │   (email + password)  │                        │                   │           │
  │                       │                        │ authorize()       │           │
  │                       │                        │  bcrypt.compare ──▶           │
  │                       │                        │                   │ SELECT user
  │                       │                        │  signJWT          │           │
  │◀── Set-Cookie: session-token ──────────────────┤                   │           │
```

- `proxy.ts` runs at the edge of every request and calls `NextAuth(authConfig).auth` to decode the JWT cookie.
- Service-side `requireSession()` / `requireAdmin()` helpers in `services/auth/session.ts` are used by Server Components — defense in depth on top of the proxy.

---

## Type Safety End-to-End

The single insight: **one Zod schema serves three purposes.**

```
                        ┌──────────────────────────┐
                        │ ResumeProfileSchema      │
                        │ (Zod)                    │
                        └──────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
   TS type via              Runtime API-input         Claude output
   z.infer<>                validation (route          contract (via
                            handlers parse body)       zodOutputFormat)
```

When we add a field to `ResumeProfileSchema`, the TypeScript type updates, the input validator updates, and the AI contract updates — atomically. There's no "fix the three places that have to agree" surface.

---

## AI Service Layer

`src/services/ai/types.ts` defines the `AIService` interface. Every method:

```ts
parseResume(pdf: Buffer): Promise<ResumeProfile>
matchJob(input): Promise<JobMatch>
analyzeResumeVsJd(input): Promise<JdAnalysis>
careerReadiness(input): Promise<CareerReadiness>
generateInterview(input): Promise<InterviewQuestionGen>
evaluateAnswer(input): Promise<InterviewEvaluation>
applicationGuide(input): Promise<ApplicationGuide>
```

The interface knows nothing about Claude. `services/ai/claude.ts` is the only implementation. `services/ai/index.ts` exports `ai: AIService = claudeAI`.

Swapping to a different provider:
1. Create `services/ai/bedrock.ts` implementing the same interface.
2. Change one line in `services/ai/index.ts`.
3. Done.

No callsite changes anywhere else in the codebase.

---

## The Hybrid Match-Scoring Decision

This is the architecture decision worth defending.

**The naive approach:** every job card on the listing makes an LLM call to compute its match %. For 12 jobs, that's 12 calls per page load. Each Haiku call is ~3s → page is 30+ seconds.

**The naive fix:** show no match % on the listing, only on the detail page. Loses the core value prop (CV-aware ranking).

**Our approach:** deterministic on the listing, AI on the detail.

```ts
// src/services/jobs/scorer.ts — deterministic, sub-millisecond, sortable
function scoreJobForResume({ resumeSkills, resumeYears, jobSkills, jobLevel }) {
  const required = jobSkills.filter(s => s.required);
  const requiredCoverage = matchedRequired.length / required.length;
  const bonusCoverage = matchedBonus.length / nonRequired.length;
  const experienceFit = max(0, 1 - abs(years - target) / 6);
  return round(60*requiredCoverage + 20*bonusCoverage + 20*experienceFit);
}
```

**On the detail page**, we call Claude Sonnet for the deep `applicationGuide` — match %, verdict, readiness narrative quoting actual resume bullets, pros/cons, learning roadmap, **cover letter email**. ~30s, but cached forever after.

The user sees a fast list of jobs ranked by their fit (instant), and gets the slow-but-deep analysis only when they're seriously considering a specific role (one click). The two scores can mildly diverge — deterministic might say 65%, AI might say 58% with verdict "stretch" — and that's *fine*, because they're answering different questions: "how does skill overlap rank you" vs. "should you actually apply."

---

## Performance Notes

- **Server Components everywhere possible.** All `/jobs`, `/jobs/[id]`, `/resume`, `/career`, `/interview`, `/dashboard` pages are Server Components. Data fetching happens server-side; the client receives rendered HTML + minimal hydration JS.
- **Client islands for interactivity.** `SaveButton`, `ApplyButton`, `MatchPanel`, `UploadDropzone`, `SessionRunner` are `"use client"` islands inside otherwise-server pages.
- **React Compiler enabled.** `next.config.ts` sets `reactCompiler: true`. Removes the need for manual `useMemo`/`useCallback` in most components.
- **Prisma indexes on the listing query** + `take`/`skip` pagination. Listing scales to 10K+ jobs without changes.
- **AIAnalysis cache** makes the most expensive call (applicationGuide) effectively free on repeat.

---

## Deployment

Vercel-first, Neon for Postgres.

```bash
# Vercel env vars (Settings → Environment Variables)
DATABASE_URL          # Neon connection string
AUTH_SECRET           # openssl rand -base64 32
NEXTAUTH_URL          # https://<your-vercel-app>.vercel.app
ANTHROPIC_API_KEY     # console.anthropic.com
ANTHROPIC_MODEL_FAST  # optional, default claude-haiku-4-5
ANTHROPIC_MODEL_SMART # optional, default claude-sonnet-4-6

# Vercel build command — runs prisma generate before next build
# (package.json's "build" script already does this)
pnpm build
```

First deploy: `pnpm db:push && pnpm db:seed` against the Neon URL once.

Subsequent deploys: nothing manual. Vercel auto-runs `pnpm install` (which triggers `postinstall: prisma generate`) then `pnpm build`.

---

## What's Intentionally Not Built

Listed here so reviewers don't ding us for missing what we considered:

- **OAuth providers.** Auth.js v5's providers[] array makes this a 15-line add. Out of scope for hackathon timeline; Credentials covers the persona.
- **PDF storage.** Source PDFs aren't persisted; only the parsed profile. Adding S3/R2 is mechanical.
- **Streaming AI responses.** Server Components await the full response. Streaming would help interview-answer eval UX but adds non-trivial state-management complexity for the runner.
- **react-table** for admin pages. Plain HTML tables are sufficient at hackathon scale.
- **i18n / Hinglish.** Brief's Theme 3. Prompt changes only; deferred to future scope.
- **Mobile native.** Web-first; the responsive design works on mobile but a native shell would be a future PWA add.

Each of these is a layered addition on top of a clean foundation — not a rewrite.
