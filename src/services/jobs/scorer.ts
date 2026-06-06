import type { ExperienceLevel } from "@prisma/client";
import { clamp } from "@/lib/utils";

/**
 * Deterministic CV → job match scorer.
 *
 * No AI call — runs in milliseconds for every job in the listing.
 * Used to attach a "match %" badge and to sort the jobs list.
 *
 * Score composition (0..100):
 *   - 60 pts max: required-skill coverage   (matched_required / total_required)
 *   - 20 pts max: bonus overlap on non-required skills the job lists
 *   - 20 pts max: experience-level fit
 */

export type ResumeSkillRow = { slug: string; years: number };
export type JobSkillRow = { slug: string; required: boolean; weight: number };

const LEVEL_YEARS: Record<ExperienceLevel, [number, number]> = {
  ENTRY: [0, 1],
  JUNIOR: [1, 3],
  MID: [3, 6],
  SENIOR: [5, 10],
  LEAD: [8, 20],
};

export function scoreJobForResume(input: {
  resumeSkills: ResumeSkillRow[];
  resumeYears: number;
  jobSkills: JobSkillRow[];
  jobLevel: ExperienceLevel;
}): {
  score: number;
  matchedRequired: string[];
  missingRequired: string[];
  matchedBonus: string[];
} {
  const resumeSet = new Set(input.resumeSkills.map((s) => s.slug.toLowerCase()));
  const required = input.jobSkills.filter((s) => s.required);
  const nonRequired = input.jobSkills.filter((s) => !s.required);

  const matchedRequired = required.filter((s) => resumeSet.has(s.slug.toLowerCase())).map((s) => s.slug);
  const missingRequired = required.filter((s) => !resumeSet.has(s.slug.toLowerCase())).map((s) => s.slug);
  const matchedBonus = nonRequired.filter((s) => resumeSet.has(s.slug.toLowerCase())).map((s) => s.slug);

  const requiredCoverage = required.length === 0 ? 1 : matchedRequired.length / required.length;
  const bonusCoverage = nonRequired.length === 0 ? 0 : matchedBonus.length / nonRequired.length;

  const [minYears, maxYears] = LEVEL_YEARS[input.jobLevel];
  const targetYears = (minYears + maxYears) / 2;
  const yearsDelta = Math.abs(input.resumeYears - targetYears);
  // 20 pts at delta=0, 0 pts at delta ≥ 6
  const experienceFit = Math.max(0, 1 - yearsDelta / 6);

  const raw = 60 * requiredCoverage + 20 * bonusCoverage + 20 * experienceFit;
  return {
    score: Math.round(clamp(raw, 0, 100)),
    matchedRequired,
    missingRequired,
    matchedBonus,
  };
}
