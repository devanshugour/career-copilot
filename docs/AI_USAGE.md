# How AI Is Used — Short Note

*Required submission item per the AI for Impact brief: "Short note on how AI was used in the product."*

---

## TL;DR

**Provider:** Anthropic Claude via `@anthropic-ai/sdk` v0.101.
**Models:**
- `claude-haiku-4-5` — fast tier, used for matching, recommendations, interview Q-gen, answer evaluation, career readiness.
- `claude-sonnet-4-6` — smart tier, used for resume PDF parsing, full Resume vs JD analysis, application guide.

**Both env-overridable** via `ANTHROPIC_MODEL_FAST` / `ANTHROPIC_MODEL_SMART`.

**Structured output:** every call uses `messages.parse()` with `output_config.format` constrained to a Zod schema (`zodOutputFormat` helper). No regex, no JSON repair, no tool_use boilerplate.

**Native PDF input:** resume parsing accepts the PDF buffer directly as a `document` content block. No client-side text extraction (`unpdf`, `pdf-parse`, etc.).

**Prompt caching:** every system prompt is marked `cache_control: { type: "ephemeral" }`.

**Caching of expensive runs:** the application-guide call (Sonnet, slow) is cached per `(userId, jobId, resumeId)` in the `AIAnalysis` table. First view ~30s, cached views ~1.4s.

---

## Where AI is Used — Per Feature

| Feature | Method | Model tier | Why this tier |
|---|---|---|---|
| Resume PDF → structured profile | `ai.parseResume(pdf)` | Smart | Document understanding (multi-column, tables) needs Sonnet's vision capacity. |
| Resume vs JD analyzer (ATS) | `ai.analyzeResumeVsJd()` | Smart | Output is long, structured, and references the candidate's actual bullets — needs reasoning depth. |
| Application guide (per-job head-to-head) | `ai.applicationGuide()` | Smart | Cover letter quality + nuanced pros/cons makes this the most-quality-sensitive call. |
| Job-vs-profile match (recommendations) | `ai.matchJob()` | Fast | Called 4× per dashboard load — latency matters more than depth. |
| Career readiness scorecard | `ai.careerReadiness()` | Fast | Output is short and structured; Haiku handles it cleanly. |
| Interview question generation | `ai.generateInterview()` | Fast | 3–10 questions per call; users want this back fast to start practicing. |
| Interview answer evaluation | `ai.evaluateAnswer()` | Fast | Called once per question; users press Submit and watch for feedback. |

## Where AI Is *Not* Used — Deliberately

- **Job listing match badges.** All 12 jobs scored deterministically against the user's resume by `services/jobs/scorer.ts` — pure SQL/JS, no LLM. 12 LLM calls per page load would cost 30s and quota; the deterministic scorer is sub-millisecond.
- **Auth, search, filters, pagination, save/apply, admin tables.** Plain CRUD, no AI needed.

This **hybrid** approach is the design lesson: use deterministic logic where input → output is well-defined and high-volume; use the LLM where narrative depth, personalization, or unstructured input understanding is what the user pays for.

## Engineering Patterns That Matter

1. **Zod schema = LLM contract = TS type = API validator.** One schema, three jobs. No drift between what the model returns, what the type system expects, and what runtime validates.

2. **`messages.parse()` over `messages.create()`.** Server-side constrained decoding via `output_config.format` is strictly more reliable than tool_use for structured output on Claude 4.5+. We never see malformed JSON.

3. **System prompts demand personalization.** Every system prompt has explicit rules like *"resumeOptimizations MUST cite specific bullets from the candidate's actual resume"* — without these, models drift to generic advice. With them, every output references the candidate's actual experience.

4. **One AIService interface, swappable provider.** `src/services/ai/types.ts` defines the interface; `claude.ts` is the only implementation. Future swap to Bedrock / Vertex / a different model is one file.

5. **Errors surface, mocks don't.** No mock implementation lives in the tree. If Claude is rate-limited, the user sees the actual error. This was a deliberate choice over a "graceful fallback" that would silently degrade output quality.

## Cost & Latency Profile (Hackathon-scale)

| Call | Tokens (typical in/out) | Latency | Cost per call (USD) |
|---|---|---|---|
| parseResume (Sonnet) | ~2K in, ~1.5K out | ~15-20s | ~$0.03 |
| analyzeResumeVsJd (Sonnet) | ~3K in, ~2K out | ~20-30s | ~$0.04 |
| applicationGuide (Sonnet) | ~4K in, ~2.5K out | ~30-45s | ~$0.05 (cached afterwards) |
| matchJob (Haiku) | ~2K in, ~500 out | ~3-5s | ~$0.005 |
| careerReadiness (Haiku) | ~2K in, ~700 out | ~5s | ~$0.006 |
| generateInterview (Haiku) | ~1.5K in, ~1K out | ~5-8s | ~$0.008 |
| evaluateAnswer (Haiku) | ~1.5K in, ~700 out | ~5s | ~$0.006 |

Cost numbers are pre-prompt-cache; with caching kicked in on a warm session, input cost drops to ~10% of these figures.

## Reproducibility

```bash
# Set the key
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Run the app
pnpm install && pnpm db:push && pnpm db:seed && pnpm dev

# Login as demo@career.local / Demo@123, upload a PDF, click any job's "Run match analysis" button.
```

All AI calls are made server-side from Next.js Route Handlers or React Server Components. The API key never leaves the server. No analytics, no third-party SDKs in the AI path beyond the official `@anthropic-ai/sdk`.
