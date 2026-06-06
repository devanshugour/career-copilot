import { claudeAI } from "./claude";
import type { AIService } from "./types";

/**
 * Single AI provider: Anthropic Claude.
 * Set ANTHROPIC_API_KEY in .env to enable.
 */
export const ai: AIService = claudeAI;

export type { AIService };
