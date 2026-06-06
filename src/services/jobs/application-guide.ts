import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ai } from "@/services/ai";
import { resumeRepo } from "@/services/resume/repository";
import type { ResumeProfile } from "@/types/resume";
import type { ApplicationGuide } from "@/types/analysis";

/** Cache-only probe — never calls AI. Returns null if no cached guide exists. */
export async function getCachedApplicationGuide(opts: {
  userId: string;
  jobId: string;
}): Promise<{ guide: ApplicationGuide; resumeId: string; jobId: string } | null> {
  const resume = await resumeRepo.getActive(opts.userId);
  if (!resume) return null;
  const cached = await prisma.aIAnalysis.findFirst({
    where: {
      userId: opts.userId,
      kind: "RESUME_JOB_MATCH",
      input: { equals: { jobId: opts.jobId, resumeId: resume.id } as unknown as Prisma.InputJsonValue },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!cached) return null;
  return {
    guide: cached.output as unknown as ApplicationGuide,
    resumeId: resume.id,
    jobId: opts.jobId,
  };
}

/**
 * Build (or fetch cached) head-to-head guide for a (user, job) pair.
 * Cache key: AIAnalysis where kind=RESUME_JOB_MATCH and input matches { jobId, resumeId }.
 */
export async function getOrBuildApplicationGuide(opts: {
  userId: string;
  jobId: string;
  force?: boolean;
}): Promise<{ guide: ApplicationGuide; cached: boolean; resumeId: string; jobId: string }> {
  const resume = await resumeRepo.getActive(opts.userId);
  if (!resume) throw new Error("Upload a resume first to run a match analysis.");

  const job = await prisma.job.findUnique({
    where: { id: opts.jobId },
    include: {
      company: { select: { name: true } },
      skills: { include: { skill: { select: { name: true } } } },
    },
  });
  if (!job) throw new Error("Job not found.");

  if (!opts.force) {
    const cached = await prisma.aIAnalysis.findFirst({
      where: {
        userId: opts.userId,
        kind: "RESUME_JOB_MATCH",
        input: { equals: { jobId: job.id, resumeId: resume.id } as unknown as Prisma.InputJsonValue },
      },
      orderBy: { createdAt: "desc" },
    });
    if (cached) {
      return {
        guide: cached.output as unknown as ApplicationGuide,
        cached: true,
        resumeId: resume.id,
        jobId: job.id,
      };
    }
  }

  const profile = resume.parsedProfile as unknown as ResumeProfile;

  const guide = await ai.applicationGuide({
    profile,
    jobTitle: job.title,
    company: job.company.name,
    location: job.location,
    jobLevel: job.experienceLevel,
    jobSkills: job.skills.map((s) => ({ name: s.skill.name, required: s.required })),
    jobDescription: job.description.slice(0, 6000),
    responsibilities: job.responsibilities,
  });

  await prisma.aIAnalysis.create({
    data: {
      userId: opts.userId,
      kind: "RESUME_JOB_MATCH",
      input: { jobId: job.id, resumeId: resume.id } as unknown as Prisma.InputJsonValue,
      output: guide as unknown as Prisma.InputJsonValue,
    },
  });

  return { guide, cached: false, resumeId: resume.id, jobId: job.id };
}
