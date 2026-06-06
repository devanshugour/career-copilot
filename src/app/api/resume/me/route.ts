import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { resumeRepo } from "@/services/resume/repository";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const resume = await resumeRepo.getActive(session.user.id);
  if (!resume) return NextResponse.json({ resume: null });
  return NextResponse.json({ resume });
}
