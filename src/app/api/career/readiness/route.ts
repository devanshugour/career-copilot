import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { buildCareerReport } from "@/services/career/readiness";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const report = await buildCareerReport(session.user.id);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
