import { requireSession } from "@/services/auth/session";
import { prisma } from "@/lib/prisma";
import { resumeRepo } from "@/services/resume/repository";
import { ScoreRadial } from "@/features/career/score-radial";
import { GenerateReportButton } from "@/features/career/generate-report-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CareerPage() {
  const session = await requireSession();
  const [report, resume] = await Promise.all([
    prisma.careerReport.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    resumeRepo.getActive(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Career Report</h1>
          <p className="text-muted-foreground">Your employability snapshot, with a plan to improve.</p>
        </div>
        <GenerateReportButton hasResume={!!resume} />
      </div>

      {!report ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No report yet — click "Generate latest report" to create one from your active resume.
        </div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle>Snapshot</CardTitle><CardDescription>Updated {report.createdAt.toLocaleString()}</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
                <ScoreRadial value={report.careerScore} label="Career" />
                <ScoreRadial value={report.employabilityScore} label="Employability" />
                <ScoreRadial value={report.atsReadiness} label="ATS" />
                <ScoreRadial value={report.interviewReadiness} label="Interview" />
                <ScoreRadial value={report.skillReadiness} label="Skills" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Improvement plan</CardTitle></CardHeader>
              <CardContent>
                <ul className="ml-5 list-disc space-y-2 text-sm text-muted-foreground">
                  {(report.improvementPlan as string[]).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Action items</CardTitle></CardHeader>
              <CardContent>
                <ul className="ml-5 list-disc space-y-2 text-sm text-muted-foreground">
                  {(report.actionItems as string[]).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
              <CardContent>
                <ul className="ml-5 list-disc space-y-2 text-sm text-muted-foreground">
                  {(report.recommendations as string[]).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
