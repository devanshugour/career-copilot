import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),

  // Anthropic Claude
  ANTHROPIC_API_KEY: z.string().min(10, "ANTHROPIC_API_KEY is required (https://console.anthropic.com/settings/keys)"),
  // Snappy default for evaluators / matchers / question generation
  ANTHROPIC_MODEL_FAST: z.string().default("claude-haiku-4-5"),
  // Higher-fidelity model for resume parsing and JD analysis
  ANTHROPIC_MODEL_SMART: z.string().default("claude-sonnet-4-6"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL_FAST: process.env.ANTHROPIC_MODEL_FAST,
  ANTHROPIC_MODEL_SMART: process.env.ANTHROPIC_MODEL_SMART,
  NODE_ENV: process.env.NODE_ENV,
});

export type Env = typeof env;
