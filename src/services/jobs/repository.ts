import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { PAGINATION } from "@/config/constants";
import type { JobsQuery, JobListItem } from "@/types/jobs";
import { scoreJobForResume } from "./scorer";

function buildWhere(q: JobsQuery): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { active: true };
  if (q.workMode && q.workMode !== "ALL") where.workMode = q.workMode;
  if (q.jobType && q.jobType !== "ALL") where.jobType = q.jobType;
  if (q.level && q.level !== "ALL") where.experienceLevel = q.level;
  if (q.q?.trim()) {
    const term = q.q.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { location: { contains: term, mode: "insensitive" } },
      { company: { name: { contains: term, mode: "insensitive" } } },
      { skills: { some: { skill: { name: { contains: term, mode: "insensitive" } } } } },
    ];
  }
  return where;
}

async function getActiveResumeForScoring(userId: string) {
  const resume = await prisma.resume.findFirst({
    where: { userId, active: true },
    select: {
      skills: { select: { skill: { select: { slug: true } }, years: true } },
      parsedProfile: true,
    },
  });
  if (!resume) return null;
  const profile = resume.parsedProfile as unknown as { totalYearsExperience?: number };
  return {
    skills: resume.skills.map((s) => ({ slug: s.skill.slug, years: s.years })),
    years: profile?.totalYearsExperience ?? 0,
  };
}

export const jobsRepo = {
  async list(q: JobsQuery, userId?: string) {
    const page = Math.max(1, q.page ?? PAGINATION.defaultPage);
    const pageSize = Math.min(PAGINATION.maxPageSize, q.pageSize ?? PAGINATION.defaultPageSize);
    const where = buildWhere(q);

    const resumeCtx = userId ? await getActiveResumeForScoring(userId) : null;
    const sortByMatch = q.sort === "match" && !!resumeCtx;

    // If sorting by match, we need to fetch a larger pool then score & sort in memory.
    // For salary / recent, DB ORDER BY does the work.
    const dbOrderBy: Prisma.JobOrderByWithRelationInput =
      q.sort === "salary" ? { salaryMax: "desc" } : { postedAt: "desc" };

    const fetchLimit = sortByMatch ? Math.min(60, PAGINATION.maxPageSize * 5) : pageSize;
    const fetchSkip = sortByMatch ? 0 : (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: dbOrderBy,
        skip: fetchSkip,
        take: fetchLimit,
        include: {
          company: { select: { id: true, name: true, logoUrl: true } },
          skills: {
            include: { skill: { select: { name: true, slug: true } } },
          },
          savedBy: userId ? { where: { userId }, select: { userId: true } } : false,
        },
      }),
      prisma.job.count({ where }),
    ]);

    let scored: JobListItem[] = rows.map((r) => {
      const item: JobListItem = {
        id: r.id,
        title: r.title,
        slug: r.slug,
        location: r.location,
        workMode: r.workMode,
        jobType: r.jobType,
        experienceLevel: r.experienceLevel,
        salaryMin: r.salaryMin,
        salaryMax: r.salaryMax,
        currency: r.currency,
        postedAt: r.postedAt,
        company: r.company,
        skills: r.skills.map((s) => ({ name: s.skill.name })),
        saved: userId ? (r as { savedBy?: { userId: string }[] }).savedBy?.length! > 0 : undefined,
      };
      if (resumeCtx) {
        const s = scoreJobForResume({
          resumeSkills: resumeCtx.skills,
          resumeYears: resumeCtx.years,
          jobSkills: r.skills.map((sk) => ({
            slug: sk.skill.slug,
            required: sk.required,
            weight: sk.weight,
          })),
          jobLevel: r.experienceLevel,
        });
        item.matchScore = s.score;
      }
      return item;
    });

    if (sortByMatch) {
      scored.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      const start = (page - 1) * pageSize;
      scored = scored.slice(start, start + pageSize);
    }

    return { items: scored, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async detail(id: string, userId?: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        skills: { include: { skill: true }, orderBy: { weight: "desc" } },
        savedBy: userId ? { where: { userId } } : false,
      },
    });
    if (!job) return null;
    const saved = userId ? (job as { savedBy?: unknown[] }).savedBy?.length! > 0 : undefined;
    return { ...job, saved };
  },

  async listSaved(userId: string) {
    const rows = await prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logoUrl: true } },
            skills: { include: { skill: { select: { name: true } } } },
          },
        },
      },
    });
    return rows.map((s) => ({
      ...s.job,
      saved: true,
      skills: s.job.skills.map((sk) => ({ name: sk.skill.name })),
    }));
  },
};
