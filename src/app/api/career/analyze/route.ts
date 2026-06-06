import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/lib/prisma";
import { resumeRepo } from "@/services/resume/repository";
import { ai } from "@/services/ai";
import type { ResumeProfile } from "@/types/resume";

const Body = z.object({
  jobDescription: z.string().min(20, "Provide a longer job description"),
  jobTitle: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const resume = await resumeRepo.getActive(session.user.id);
  if (!resume) return NextResponse.json({ error: "Upload a resume first" }, { status: 400 });

  const profile = resume.parsedProfile as unknown as ResumeProfile;
  const result = await ai.analyzeResumeVsJd({
    profile,
    jobDescription: parsed.data.jobDescription,
  });

  await prisma.aIAnalysis.create({
    data: {
      userId: session.user.id,
      kind: "RESUME_JD_ANALYZE",
      input: { jobTitle: parsed.data.jobTitle, jdSnippet: parsed.data.jobDescription.slice(0, 1000) },
      output: result as unknown as object,
    },
  });

  return NextResponse.json(result);
}
