import type { JobType, WorkMode, ExperienceLevel } from "@prisma/client";

export type JobsQuery = {
  q?: string;
  workMode?: WorkMode | "ALL";
  jobType?: JobType | "ALL";
  level?: ExperienceLevel | "ALL";
  page?: number;
  pageSize?: number;
  sort?: "recent" | "salary" | "match";
};

export type JobListItem = {
  id: string;
  title: string;
  slug: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  postedAt: Date;
  company: { id: string; name: string; logoUrl: string | null };
  skills: { name: string }[];
  saved?: boolean;
  /** Deterministic CV→job match score (0..100), present when a resume is loaded. */
  matchScore?: number;
};
