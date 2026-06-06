import Link from "next/link";
import { Sparkles } from "lucide-react";
import { auth } from "@/services/auth/auth";
import { rankJobsForUser } from "@/services/jobs/recommend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { formatSalary } from "@/lib/utils";

export async function Recommendations() {
  const session = await auth();
  if (!session?.user) return null;
  let ranked: Awaited<ReturnType<typeof rankJobsForUser>> = [];
  try {
    ranked = await rankJobsForUser(session.user.id, { take: 4 });
  } catch (e) {
    console.error("[Recommendations] failed:", e instanceof Error ? e.message : e);
  }

  if (ranked.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Recommended for you</CardTitle>
          <CardDescription>Upload a resume to see AI-ranked jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm"><Link href={ROUTES.resume}>Upload resume</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Recommended for you</CardTitle>
        <CardDescription>Top {ranked.length} jobs ranked against your resume.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranked.map(({ job, match }) => {
          const tone = match.matchScore >= 80 ? "success" : match.matchScore >= 60 ? "default" : "secondary";
          return (
            <Link key={job.id} href={ROUTES.jobDetail(job.id)} className="block rounded-lg border p-4 transition hover:border-primary/40">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{job.title}</div>
                  <div className="text-xs text-muted-foreground">{job.company.name} · {job.location}</div>
                </div>
                <Badge variant={tone as "success" | "default" | "secondary"}>{match.matchScore}% match</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{match.rationale}</div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                {match.missingSkills.length > 0 && (
                  <span className="text-destructive">Missing: {match.missingSkills.slice(0, 3).join(", ")}</span>
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
