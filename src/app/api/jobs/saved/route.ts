import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { jobId } = (await req.json()) as { jobId: string };
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const existing = await prisma.savedJob.findUnique({
    where: { userId_jobId: { userId: session.user.id, jobId } },
  });
  if (existing) {
    await prisma.savedJob.delete({ where: { userId_jobId: { userId: session.user.id, jobId } } });
    return NextResponse.json({ saved: false });
  }
  await prisma.savedJob.create({ data: { userId: session.user.id, jobId } });
  return NextResponse.json({ saved: true });
}
