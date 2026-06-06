import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import {
  getOrBuildApplicationGuide,
  getCachedApplicationGuide,
} from "@/services/jobs/application-guide";

export async function POST(req: Request, ctx: RouteContext<"/api/jobs/[id]/match">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  try {
    const result = await getOrBuildApplicationGuide({
      userId: session.user.id,
      jobId: id,
      force,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}

export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]/match">) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const cached = await getCachedApplicationGuide({ userId: session.user.id, jobId: id });
  if (!cached) return NextResponse.json({ guide: null });
  return NextResponse.json({ ...cached, cached: true });
}
