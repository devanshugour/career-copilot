import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { ai } from "@/services/ai";
import { resumeRepo } from "@/services/resume/repository";
import { prisma } from "@/lib/prisma";
import { UPLOAD } from "@/config/constants";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });
  if (file.size > UPLOAD.maxResumeBytes) return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
  if (!UPLOAD.acceptedMime.includes(file.type as "application/pdf"))
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 415 });

  const pdf = Buffer.from(await file.arrayBuffer());

  let profile;
  try {
    profile = await ai.parseResume(pdf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resume parse failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const resume = await resumeRepo.create({
    userId: session.user.id,
    fileName: file.name,
    fileSize: file.size,
    rawText: "",
    profile,
  });

  await prisma.aIAnalysis.create({
    data: {
      userId: session.user.id,
      kind: "RESUME_PARSE",
      input: { fileName: file.name, fileSize: file.size },
      output: profile as unknown as object,
    },
  });

  return NextResponse.json({ resumeId: resume.id, profile });
}
