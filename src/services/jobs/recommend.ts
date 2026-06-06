import { prisma } from "@/lib/prisma";
import { ai } from "@/services/ai";
import type { ResumeProfile } from "@/types/resume";

/**
 * Rank active jobs against a candidate profile.
 * Pulls a candidate pool (top N by skill overlap), then calls AI matchJob for the top K.
 */
export async function rankJobsForUser(userId: string, opts: { take?: number; pool?: number } = {}) {
  const take = opts.take ?? 6;
  const pool = opts.pool ?? 20;

  const resume = await prisma.resume.findFirst({
    where: { userId, active: true },
    include: { skills: { include: { skill: true } } },
  });
  if (!resume) return [];

  const profile = resume.parsedProfile as unknown as ResumeProfile;
  const profileSkillSlugs = resume.skills.map((s) => s.skill.slug);

  const candidatePool = await prisma.job.findMany({
    where: {
      active: true,
      ...(profileSkillSlugs.length
        ? {
            skills: { some: { skill: { slug: { in: profileSkillSlugs } } } },
          }
        : {}),
    },
    orderBy: { postedAt: "desc" },
    take: pool,
    include: {
      company: { select: { id: true, name: true, logoUrl: true } },
      skills: { include: { skill: true } },
    },
  });

  const fallback = candidatePool.length
    ? candidatePool
    : await prisma.job.findMany({
        where: { active: true },
        orderBy: { postedAt: "desc" },
        take: pool,
        include: { company: { select: { id: true, name: true, logoUrl: true } }, skills: { include: { skill: true } } },
      });

  const scored = await Promise.all(
    fallback.slice(0, take).map(async (job) => {
      try {
        const match = await ai.matchJob({
          profile,
          jobTitle: job.title,
          jobSkills: job.skills.map((s) => s.skill.name),
          jobDescription: job.description.slice(0, 4000),
        });
        return { job, match };
      } catch (e) {
        console.error(`[rankJobsForUser] match failed for ${job.id}:`, e instanceof Error ? e.message : e);
        return null;
      }
    }),
  );

  const ok = scored.filter((s): s is NonNullable<typeof s> => s !== null);
  ok.sort((a, b) => b.match.matchScore - a.match.matchScore);
  return ok;
}
