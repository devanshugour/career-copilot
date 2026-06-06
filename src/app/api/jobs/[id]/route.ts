import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { jobsRepo } from "@/services/jobs/repository";

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  const { id } = await ctx.params;
  const session = await auth();
  const job = await jobsRepo.detail(id, session?.user?.id);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}
