import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ResumeProfile } from "@/types/resume";

export const resumeRepo = {
  async create(input: {
    userId: string;
    fileName: string;
    fileSize: number;
    rawText: string;
    profile: ResumeProfile;
  }) {
    // Deactivate previous active resumes
    await prisma.resume.updateMany({
      where: { userId: input.userId, active: true },
      data: { active: false },
    });

    // Materialize skills so we have a normalized skill catalog
    const skillNames = input.profile.skills.map((s) => s.name.toLowerCase());
    const existing = await prisma.skill.findMany({ where: { slug: { in: skillNames } } });
    const existingSlugs = new Set(existing.map((s) => s.slug));
    const toCreate = skillNames
      .filter((n) => !existingSlugs.has(n))
      .map((n) => ({ name: n, slug: n }));
    if (toCreate.length) await prisma.skill.createMany({ data: toCreate, skipDuplicates: true });
    const allSkills = await prisma.skill.findMany({ where: { slug: { in: skillNames } } });
    const skillIdByName = new Map(allSkills.map((s) => [s.slug, s.id]));

    const resume = await prisma.resume.create({
      data: {
        userId: input.userId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        rawText: input.rawText.slice(0, 50000),
        parsedProfile: input.profile as unknown as Prisma.InputJsonValue,
        summary: input.profile.summary.slice(0, 1200),
        skills: {
          create: input.profile.skills
            .map((s) => ({
              skillId: skillIdByName.get(s.name.toLowerCase())!,
              years: s.years ?? 0,
              proficiency: { beginner: 30, intermediate: 60, advanced: 80, expert: 95 }[s.level],
              source: "ai",
            }))
            .filter((s) => !!s.skillId),
        },
      },
      include: { skills: { include: { skill: true } } },
    });
    return resume;
  },

  async getActive(userId: string) {
    return prisma.resume.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
      include: { skills: { include: { skill: true } } },
    });
  },
};
