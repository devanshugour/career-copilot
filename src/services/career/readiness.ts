import { prisma } from "@/lib/prisma";
import { ai } from "@/services/ai";
import { resumeRepo } from "@/services/resume/repository";
import type { ResumeProfile } from "@/types/resume";
import type { JdAnalysis } from "@/types/analysis";

export async function buildCareerReport(userId: string) {
  const resume = await resumeRepo.getActive(userId);
  if (!resume) throw new Error("Upload a resume first");

  const profile = resume.parsedProfile as unknown as ResumeProfile;

  const latestAnalysis = await prisma.aIAnalysis.findFirst({
    where: { userId, kind: "RESUME_JD_ANALYZE" },
    orderBy: { createdAt: "desc" },
  });

  const result = await ai.careerReadiness({
    profile,
    latestAnalysis: latestAnalysis?.output as unknown as JdAnalysis | undefined,
  });

  const report = await prisma.careerReport.create({
    data: {
      userId,
      resumeId: resume.id,
      careerScore: result.careerScore,
      employabilityScore: result.employabilityScore,
      atsReadiness: result.atsReadiness,
      interviewReadiness: result.interviewReadiness,
      skillReadiness: result.skillReadiness,
      improvementPlan: result.improvementPlan,
      actionItems: result.actionItems,
      recommendations: result.recommendations,
    },
  });

  return report;
}
