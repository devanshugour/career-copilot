import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/services/auth/auth";
import { evaluateInterviewAnswer } from "@/services/interview/service";

const Body = z.object({
  questionId: z.string(),
  answer: z.string().min(2).max(8000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  try {
    const result = await evaluateInterviewAnswer({ userId: session.user.id, ...parsed.data });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
