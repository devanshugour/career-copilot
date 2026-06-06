import Link from "next/link";
import { Briefcase, FileText, MessageSquare, Sparkles, ArrowRight, Send, Clock } from "lucide-react";
import { requireSession } from "@/services/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Recommendations } from "@/features/jobs/recommendations";
import { ROUTES } from "@/config/routes";
import { relativeTime } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [resume, latestReport, savedCount, jobsCount, applicationsCount, recentInterview, recentSaved, recentApps] = await Promise.all([
    prisma.resume.findFirst({ where: { userId, active: true }, orderBy: { createdAt: "desc" } }),
    prisma.careerReport.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.savedJob.count({ where: { userId } }),
    prisma.job.count({ where: { active: true } }),
    prisma.jobApplication.count({ where: { userId } }),
    prisma.interviewSession.findFirst({
      where: { userId, overallScore: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, jobTitle: true, overallScore: true, updatedAt: true },
    }),
    prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { job: { select: { id: true, title: true, company: { select: { name: true } } } } },
    }),
    prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { job: { select: { id: true, title: true, company: { select: { name: true } } } } },
    }),
  ]);

  const stats = [
    { label: "Open jobs", value: jobsCount, icon: Briefcase, href: ROUTES.jobs },
    { label: "Saved jobs", value: savedCount, icon: Sparkles, href: ROUTES.savedJobs },
    { label: "Applications", value: applicationsCount, icon: Send, href: ROUTES.jobs },
    { label: "Career score", value: latestReport?.careerScore ?? "—", icon: MessageSquare, href: ROUTES.career },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {session.user.name?.split(" ")[0] ?? "there"} 👋</h1>
        <p className="text-muted-foreground">Your career command center.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition hover:border-primary/40">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Recommendations />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Recent activity</CardTitle>
          <CardDescription>Your latest moves at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <ActivityColumn title="Last interview">
              {recentInterview ? (
                <Link href={`${ROUTES.interview}/${recentInterview.id}`} className="block rounded-md border p-3 hover:border-primary/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{recentInterview.jobTitle ?? "Session"}</div>
                    <Badge variant={(recentInterview.overallScore ?? 0) >= 80 ? "success" : "secondary"}>
                      {recentInterview.overallScore}/100
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{relativeTime(recentInterview.updatedAt)}</div>
                </Link>
              ) : (
                <Empty href={ROUTES.interview} label="No interview attempts yet" cta="Start practice" />
              )}
            </ActivityColumn>

            <ActivityColumn title="Saved jobs">
              {recentSaved.length === 0 ? (
                <Empty href={ROUTES.jobs} label="Nothing saved yet" cta="Browse jobs" />
              ) : (
                recentSaved.map((s) => (
                  <Link key={s.job.id} href={ROUTES.jobDetail(s.job.id)} className="block rounded-md border p-3 text-sm hover:border-primary/40">
                    <div className="truncate font-medium">{s.job.title}</div>
                    <div className="text-xs text-muted-foreground">{s.job.company.name} · {relativeTime(s.createdAt)}</div>
                  </Link>
                ))
              )}
            </ActivityColumn>

            <ActivityColumn title="Applications">
              {recentApps.length === 0 ? (
                <Empty href={ROUTES.jobs} label="No applications yet" cta="Apply to a job" />
              ) : (
                recentApps.map((a) => (
                  <Link key={a.id} href={ROUTES.jobDetail(a.job.id)} className="block rounded-md border p-3 text-sm hover:border-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-medium">{a.job.title}</div>
                      <Badge variant="outline">{a.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{a.job.company.name} · {relativeTime(a.createdAt)}</div>
                  </Link>
                ))
              )}
            </ActivityColumn>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Two steps to unlock AI-powered job ranking and ATS scoring.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Upload your resume</div>
                  <div className="text-xs text-muted-foreground">
                    {resume ? `Last uploaded: ${resume.fileName}` : "PDF, up to 5 MB"}
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant={resume ? "outline" : "default"}>
                <Link href={ROUTES.resume}>{resume ? "View" : "Upload"} <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Run Resume vs JD analysis</div>
                  <div className="text-xs text-muted-foreground">ATS score, skill gaps, learning roadmap.</div>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href={ROUTES.resumeAnalyze}>Open <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Practice an interview</div>
                  <div className="text-xs text-muted-foreground">Technical, HR, behavioral, scenario.</div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTES.interview}>Start <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your latest career report</CardTitle>
            <CardDescription>Snapshot of where you stand right now.</CardDescription>
          </CardHeader>
          <CardContent>
            {latestReport ? (
              <div className="grid grid-cols-2 gap-3">
                <ScoreStat label="Career score" value={latestReport.careerScore} />
                <ScoreStat label="Employability" value={latestReport.employabilityScore} />
                <ScoreStat label="ATS readiness" value={latestReport.atsReadiness} />
                <ScoreStat label="Interview readiness" value={latestReport.interviewReadiness} />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Generate your first career report from the{" "}
                <Link className="text-primary hover:underline" href={ROUTES.career}>Career page</Link>.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">
        {value}
        <span className="ml-1 text-sm text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function ActivityColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Empty({ href, label, cta }: { href: string; label: string; cta: string }) {
  return (
    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      <div>{label}</div>
      <Link href={href} className="mt-1 inline-block text-xs text-primary hover:underline">{cta} →</Link>
    </div>
  );
}
