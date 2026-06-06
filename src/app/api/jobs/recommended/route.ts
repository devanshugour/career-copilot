import { NextResponse } from "next/server";
import { auth } from "@/services/auth/auth";
import { rankJobsForUser } from "@/services/jobs/recommend";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await rankJobsForUser(session.user.id, { take: 6 });
  return NextResponse.json({ items });
}
