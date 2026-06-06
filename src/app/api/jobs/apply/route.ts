import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { jobId } = (await req.json()) as { jobId: string };
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const application = await prisma.jobApplication.upsert({
    where: { userId_jobId: { userId: session.user.id, jobId } },
    update: {},
    create: { userId: session.user.id, jobId, status: "APPLIED" },
  });
  return NextResponse.json({ application });
}
