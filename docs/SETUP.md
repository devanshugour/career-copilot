# Setup Guide

Get Career Copilot running locally in ~5 minutes.

---

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 22 LTS | Next.js 16 + the `--env-file=.env` flag |
| pnpm | ≥ 10 | Lockfile is pnpm-format; npm/yarn won't work without changes |
| PostgreSQL | hosted on Neon | The Prisma adapter is Postgres-only |
| Anthropic API key | any tier | All AI calls — get one at [console.anthropic.com](https://console.anthropic.com/settings/keys) |

---

## Step 1 — Clone and install

```bash
git clone <repo-url> career-copilot
cd career-copilot
pnpm install
```

`pnpm install` triggers `postinstall: prisma generate`, which creates the typed Prisma client. If you see "Module '@prisma/client' has no exported member 'PrismaClient'" anywhere, run `pnpm prisma generate` manually.

---

## Step 2 — Provision a Neon database

1. Sign up at [neon.tech](https://neon.tech) (free tier is plenty for hackathon work).
2. Create a project named `career-copilot`.
3. Copy the **pooled** connection string (the one with `-pooler` in the host). It looks like:
   ```
   postgresql://user:pass@ep-xyz-pooler.region.aws.neon.tech/career_copilot?sslmode=require
   ```

Neon's pooled connection is required because Vercel's serverless functions don't tolerate long-lived connections.

---

## Step 3 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# REQUIRED
DATABASE_URL="postgresql://...-pooler.../career_copilot?sslmode=require"
AUTH_SECRET="$(openssl rand -base64 32)"           # paste the output
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-api03-..."

# OPTIONAL — defaults shown
# ANTHROPIC_MODEL_FAST="claude-haiku-4-5"          # matchers/evaluators
# ANTHROPIC_MODEL_SMART="claude-sonnet-4-6"        # parser/analyzer
```

Generate `AUTH_SECRET` exactly once and reuse it across deployments — changing it invalidates every existing session.

---

## Step 4 — Initialize the database

```bash
pnpm db:push    # applies the Prisma schema to Neon (no migration history needed for hackathon)
pnpm db:seed    # seeds 12 jobs, 6 companies, 40+ skills, admin + demo users
```

`db:push` is appropriate for hackathon iteration. For production, use `pnpm prisma migrate dev` to generate proper migration files (we already have one in `prisma/migrations/`).

After seeding, you have two users:

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@career.local | Admin@123 |
| USER | demo@career.local | Demo@123 |

---

## Step 5 — Run

```bash
pnpm dev
```

Visit [localhost:3000](http://localhost:3000). The marketing landing page loads in ~250ms.

Sign in as **demo@career.local / Demo@123** and walk through:

1. **`/resume`** — drop in any PDF resume. ~15-20s Sonnet parse; the structured profile renders below.
2. **`/jobs`** — every job card now has a match % badge; list sorts by match by default.
3. **Click any job → "Run match analysis"** — ~30s Sonnet head-to-head. Match %, verdict, pros/cons, learning roadmap, **cover-letter email with a Copy button**.
4. **`/resume/analyze`** — paste any JD, get ATS score + roadmap.
5. **`/interview`** — generate 5 questions, type answers, submit each for a per-axis score.
6. **`/career`** — five-radial readiness scorecard.

---

## Common gotchas

### `Failed to type check ... 'PrismaClient'`
Run `pnpm prisma generate`. The `postinstall` script in `package.json` does this automatically — if you used `pnpm install --ignore-scripts`, lifecycle scripts were skipped.

### `ECONNREFUSED` to Neon
Your pooler URL is wrong, or you're behind a firewall blocking outbound 5432. Check the URL has `-pooler` and `sslmode=require`.

### `Anthropic API error (401)`
Wrong `ANTHROPIC_API_KEY`. Keys start with `sk-ant-api03-`.

### `useSearchParams() should be wrapped in a suspense boundary`
Only happens on `next build`. `/login` and `/register` already have `<Suspense>` wrappers — if you add another page with `useSearchParams()`, do the same.

### Hot reload kills the Prisma client connection
Already handled. `src/lib/prisma.ts` uses the global singleton pattern, so Next.js HMR doesn't open new connections per change.

---

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo on Vercel.
3. Add the four env vars from Step 3 to **Settings → Environment Variables**:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` → `https://<your-app>.vercel.app`
   - `ANTHROPIC_API_KEY`
4. Deploy.

Vercel runs `pnpm install` (triggers `prisma generate` via postinstall) → `pnpm build` (runs `prisma generate && next build`). The schema is already on Neon from your local `pnpm db:push`, so no additional step is needed for the first deploy.

For subsequent schema changes, run `pnpm prisma migrate deploy` in a Vercel deploy hook or as a one-off command.

---

## Useful commands

```bash
pnpm dev            # dev server on :3000
pnpm build          # production build (prisma generate + next build)
pnpm start          # serve production build
pnpm lint           # ESLint

pnpm db:generate    # regenerate Prisma client
pnpm db:push        # apply schema without migration history (hackathon mode)
pnpm db:migrate     # interactive migration (production mode)
pnpm db:studio      # open Prisma Studio (web UI on :5555)
pnpm db:seed        # re-seed the demo data (idempotent — uses upsert)

pnpm exec tsc --noEmit    # type-check without emitting
```

---

## Health checks

After setup, these should all pass:

```bash
# 1. Type-check clean
pnpm exec tsc --noEmit
# expected: no output

# 2. Production build clean
pnpm build
# expected: "✓ Compiled successfully" + route listing

# 3. DB seeded
pnpm exec node -e "import('@prisma/client').then(m => { const p = new m.PrismaClient(); p.job.count().then(n => { console.log('jobs:', n); p.\$disconnect(); }); })"
# expected: jobs: 12

# 4. Anthropic key works
curl -sS https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5","max_tokens":50,"messages":[{"role":"user","content":"say ok"}]}' | head -c 200
# expected: JSON with content array containing "ok"
```

If all four pass, the app is fully wired.
