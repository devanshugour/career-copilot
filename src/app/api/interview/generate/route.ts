import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/services/auth/auth";
import { startInterviewSession } from "@/services/interview/service";

const Body = z.object({
  jobId: z.string().optional(),
  jobTitle: z.string().optional(),
  jdSnippet: z.string().optional(),
  count: z.number().int().min(3).max(10).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const out = await startInterviewSession({ userId: session.user.id, ...parsed.data });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
