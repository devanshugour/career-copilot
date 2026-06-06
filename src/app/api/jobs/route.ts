import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { jobsRepo } from "@/services/jobs/repository";
import type { JobsQuery } from "@/types/jobs";

export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const q: JobsQuery = {
    q: url.searchParams.get("q") ?? undefined,
    workMode: (url.searchParams.get("workMode") as JobsQuery["workMode"]) ?? "ALL",
    jobType: (url.searchParams.get("jobType") as JobsQuery["jobType"]) ?? "ALL",
    level: (url.searchParams.get("level") as JobsQuery["level"]) ?? "ALL",
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 12),
    sort: (url.searchParams.get("sort") as "recent" | "salary") ?? "recent",
  };
  const data = await jobsRepo.list(q, session?.user?.id);
  return NextResponse.json(data);
}
