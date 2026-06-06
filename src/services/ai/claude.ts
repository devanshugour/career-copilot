import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ZodType } from "zod";
import { env } from "@/config/env";
import type { AIService } from "./types";
import { PROMPTS } from "./prompts";
import {
  JobMatchSchema,
  JdAnalysisSchema,
  CareerReadinessSchema,
  InterviewQuestionGenSchema,
  InterviewEvaluationSchema,
  ApplicationGuideSchema,
} from "@/types/analysis";
import { ResumeProfileSchema } from "@/types/resume";
import type { ResumeProfile } from "@/types/resume";

/**
 * Anthropic Claude integration for Career Copilot.
 *
 * Design:
 *   - Structured output is constrained server-side via `output_config.format`
 *     with Zod schemas — no manual JSON parsing, no tool_use boilerplate.
 *   - PDF resumes are sent as a native `document` content block — no client-side
 *     text extraction.
 *   - Model tiering: Haiku 4.5 for snappy evaluators / matchers (default),
 *     Sonnet 4.6 for resume parsing and full JD analysis (higher fidelity).
 *   - Prompt caching with `cache_control: ephemeral` on every system prompt.
 *     The SDK auto-retries 429 and 5xx with exponential backoff (maxRetries: 2).
 *
 * Reference: anthropic.com/docs — structured-outputs, pdf-support, prompt-caching.
 */

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  _client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 3,
  });
  return _client;
}

type Tier = "fast" | "smart";

function modelFor(tier: Tier): string {
  return tier === "smart" ? env.ANTHROPIC_MODEL_SMART : env.ANTHROPIC_MODEL_FAST;
}

async function structuredCall<T>(opts: {
  tier: Tier;
  system: string;
  userContent: Anthropic.ContentBlockParam[] | string;
  schema: ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const content =
    typeof opts.userContent === "string"
      ? [{ type: "text" as const, text: opts.userContent }]
      : opts.userContent;

  try {
    const response = await client().messages.parse({
      model: modelFor(opts.tier),
      max_tokens: opts.maxTokens ?? 4096,
      system: [
        {
          type: "text",
          text: opts.system,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content }],
      output_config: {
        format: zodOutputFormat(opts.schema),
      },
    });

    if (response.stop_reason === "refusal") {
      throw new Error("Claude refused the request for safety reasons.");
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("Claude hit the max_tokens limit before completing output.");
    }
    if (!response.parsed_output) {
      throw new Error("Claude returned no parseable output.");
    }
    return response.parsed_output;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      throw new Error("Claude is rate-limited right now. Try again in a minute.");
    }
    if (e instanceof Anthropic.AuthenticationError) {
      throw new Error("Invalid ANTHROPIC_API_KEY. Check your .env.");
    }
    if (e instanceof Anthropic.APIError) {
      throw new Error(`Claude API error (${e.status}): ${e.message}`);
    }
    throw e;
  }
}

export const claudeAI: AIService = {
  async parseResume(pdf: Buffer): Promise<ResumeProfile> {
    const data = pdf.toString("base64");
    return structuredCall({
      tier: "smart",
      maxTokens: 4096,
      system: PROMPTS.parseResume,
      userContent: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data },
        },
        {
          type: "text",
          text: "Parse the attached PDF resume into the structured profile schema.",
        },
      ],
      schema: ResumeProfileSchema,
    });
  },

  matchJob(input) {
    return structuredCall({
      tier: "fast",
      maxTokens: 1024,
      system: PROMPTS.matchJob,
      userContent: JSON.stringify(input),
      schema: JobMatchSchema,
    });
  },

  analyzeResumeVsJd(input) {
    return structuredCall({
      tier: "smart",
      maxTokens: 4096,
      system: PROMPTS.analyzeJd,
      userContent: JSON.stringify(input),
      schema: JdAnalysisSchema,
    });
  },

  careerReadiness(input) {
    return structuredCall({
      tier: "fast",
      maxTokens: 2048,
      system: PROMPTS.careerReadiness,
      userContent: JSON.stringify(input),
      schema: CareerReadinessSchema,
    });
  },

  generateInterview(input) {
    return structuredCall({
      tier: "fast",
      maxTokens: 2048,
      system: PROMPTS.generateInterview,
      userContent: JSON.stringify(input),
      schema: InterviewQuestionGenSchema,
    });
  },

  evaluateAnswer(input) {
    return structuredCall({
      tier: "fast",
      maxTokens: 1024,
      system: PROMPTS.evaluateAnswer,
      userContent: JSON.stringify(input),
      schema: InterviewEvaluationSchema,
    });
  },

  applicationGuide(input) {
    return structuredCall({
      tier: "smart",
      maxTokens: 4096,
      system: PROMPTS.applicationGuide,
      userContent: JSON.stringify(input),
      schema: ApplicationGuideSchema,
    });
  },
};
