# Career Copilot

**Tagline:** *From Resume to Offer — Your AI Career Copilot.*

Production-grade Next.js application built for the **AI for Impact** hackathon (Employability theme). Users upload a resume; the app parses it with AI, matches it against a live job board, scores it against any job description (ATS + skill gap + roadmap), generates a career-readiness report, and rehearses interviews with scored answers.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React Compiler) |
| Language | TypeScript |
| Styling | Tailwind v4 + custom Shadcn-style components |
| Auth | Auth.js v5 (NextAuth) — JWT strategy, Credentials provider |
| DB | PostgreSQL (Neon recommended) via Prisma 6 |
| AI | [Anthropic Claude](https://docs.claude.com) via `@anthropic-ai/sdk` — Haiku 4.5 for snappy evaluators, Sonnet 4.6 for resume parsing + JD analysis |
| PDF | Native Claude `document` content block — no client-side text extraction |
| State | React Server Components + TanStack Query for client cache |
| UI | Tailwind v4, Radix Primitives, Lucide icons, Sonner toasts |

## Architecture at a glance

```
src/
├── app/
│   ├── (auth)/             ← public auth routes
│   ├── (app)/              ← authenticated app
│   ├── admin/              ← ADMIN-only
│   └── api/                ← REST endpoints (route handlers)
├── features/               ← UI building blocks per feature
├── services/               ← Domain logic (repository + service layer)
│   ├── ai/                 ← AIService interface, Claude impl (Haiku + Sonnet tiers)
│   ├── auth/               ← Auth.js setup, session helpers
│   ├── jobs/               ← jobs repo + ranking service
│   ├── resume/             ← resume repo
│   ├── career/             ← career readiness builder
│   └── interview/          ← interview session service
├── lib/                    ← prisma client, pdf parser, utils
├── providers/              ← theme, query, session providers
├── types/                  ← shared zod schemas + TS types
├── hooks/                  ← client hooks
└── config/                 ← env, routes, navigation, constants
proxy.ts                    ← Next.js 16 proxy (renamed from middleware)
prisma/
├── schema.prisma           ← full domain model
└── seed.ts                 ← seed companies/jobs/skills/users
```

The AI layer follows the **Dependency Inversion Principle**: every consumer imports the `AIService` interface from `@/services/ai`. The single implementation is **Claude** (`src/services/ai/claude.ts`):

- **Model tiers** — `claude-haiku-4-5` for snappy responses (matching, recommendations, interview Q gen, answer eval, career readiness) and `claude-sonnet-4-6` for higher-fidelity work (resume PDF parsing, full Resume vs JD analysis). Override via `ANTHROPIC_MODEL_FAST` / `ANTHROPIC_MODEL_SMART`.
- **Native PDF input** — `parseResume(pdf: Buffer)` sends the raw PDF as a `document` content block. No `unpdf` step.
- **Structured output** — every call uses `messages.parse()` + `output_config.format` with the existing Zod schemas in `src/types/*`. The API constrains generation to the schema and the SDK returns a typed object.
- **Prompt caching** — system prompts ship with `cache_control: ephemeral` so repeated calls reuse the prefix.
- **Resilience** — SDK auto-retries 429 / 5xx with exponential backoff; typed exceptions (`Anthropic.RateLimitError`, `Anthropic.AuthenticationError`, `Anthropic.APIError`) map to clean error messages.

## Modules

1. **Authentication** — Register / Login / Logout / JWT session / RBAC (USER, ADMIN).
2. **Jobs portal** — list with search/filter/sort/pagination, detail, save, apply.
3. **Resume upload** — PDF sent directly to Claude as a native `document` block → structured profile back → persisted with normalized skills.
4. **Resume vs JD analyzer** — Match %, ATS score, matched/missing skills, optimizations, learning roadmap.
5. **AI-ranked jobs** — Dashboard widget ranks live jobs against your resume.
6. **Career readiness report** — 5 composite scores + improvement plan, action items, recommendations.
7. **Interview practice** — Generate 3–10 technical/HR/behavioral/scenario questions, submit answers, get scored feedback per axis (accuracy/communication/completeness/relevance) plus suggested answer.
8. **Admin** — Jobs, Users, Companies, Skills dashboards.

## API contracts

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | `{userId}` |
| GET / POST | `/api/auth/[...nextauth]` | NextAuth handlers | session cookie |
| GET | `/api/jobs` | query: `q, workMode, jobType, level, sort, page, pageSize` | `{items, total, page, pageSize, totalPages}` |
| GET | `/api/jobs/:id` | — | full Job |
| GET | `/api/jobs/recommended` | — | `{items: {job, match}[]}` |
| POST | `/api/jobs/saved` | `{jobId}` | `{saved: boolean}` |
| POST | `/api/jobs/apply` | `{jobId}` | `{application}` |
| POST | `/api/resume/upload` | `multipart file` | `{resumeId, profile}` |
| GET  | `/api/resume/me` | — | `{resume}` |
| POST | `/api/career/analyze` | `{jobTitle?, jobDescription}` | `JdAnalysis` |
| POST | `/api/career/readiness` | — | `CareerReport` |
| POST | `/api/interview/generate` | `{jobTitle?, jdSnippet?, count?}` | `InterviewSession` |
| POST | `/api/interview/evaluate` | `{questionId, answer}` | `InterviewAnswer` |

## Local setup

```bash
# 1. Install
pnpm install

# 2. Create a Neon project at https://neon.tech and copy the connection string.
cp .env.example .env
# Edit .env:
#   DATABASE_URL  ← from Neon
#   AUTH_SECRET   ← `openssl rand -base64 32`

# 3. Push schema + seed
pnpm db:push
pnpm db:seed

# 4. Run dev server
pnpm dev
```

Visit http://localhost:3000.

**Default credentials after seed:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@career.local | Admin@123 |
| User | demo@career.local | Demo@123 |

## Configure Claude

1. Get an API key at <https://console.anthropic.com/settings/keys>.
2. Put it in `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
3. (Optional) Override default model tiers — defaults are Haiku 4.5 / Sonnet 4.6:
   ```env
   ANTHROPIC_MODEL_FAST="claude-haiku-4-5"     # matchers / evaluators / question gen
   ANTHROPIC_MODEL_SMART="claude-sonnet-4-6"   # resume PDF parse + full JD analysis
   ```
4. Restart `pnpm dev`. No code changes.

## Deploy (Vercel)

1. Push to GitHub, import the repo on Vercel.
2. Set environment variables: `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL=https://<vercel-app>.vercel.app`, `ANTHROPIC_API_KEY`. Optionally override `ANTHROPIC_MODEL_FAST` / `ANTHROPIC_MODEL_SMART`.
3. In Vercel build settings, override the build command if you want migrations to run automatically:
   ```
   pnpm prisma migrate deploy && pnpm build
   ```
4. After first deploy, run `pnpm db:seed` once via Vercel CLI (`vercel env pull`) or Neon's web SQL editor.

## What's stubbed for the hackathon

- The Claude implementation is wired in `src/services/ai/claude.ts` — strict output via `messages.parse()` + `output_config.format`, native PDF input, prompt caching, SDK auto-retry. Set `ANTHROPIC_API_KEY` and it runs.
- File uploads are processed in-memory (no S3 storage). The parsed profile is persisted; the source PDF is not retained.

## Next steps if extending past the hackathon

- Persist source PDFs to S3 / R2 with signed URLs.
- Per-job interview sessions (currently job-scoped via `jobId` but UI defaults to free-form).
- Background jobs for resume parsing (queue + worker) once an LLM call exceeds Vercel's serverless timeout.
- More granular RBAC and audit logs.

## License

MIT — built for hackathon submission.
