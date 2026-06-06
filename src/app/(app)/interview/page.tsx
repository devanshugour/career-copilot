import Link from "next/link";
import { requireSession } from "@/services/auth/session";
import { prisma } from "@/lib/prisma";
import { resumeRepo } from "@/services/resume/repository";
import { StartInterviewForm } from "@/features/interview/start-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InterviewPage() {
  const session = await requireSession();
  const [resume, sessions] = await Promise.all([
    resumeRepo.getActive(session.user.id),
    prisma.interviewSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { questions: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview Practice</h1>
        <p className="text-muted-foreground">Generate AI questions and get scored answers with feedback.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StartInterviewForm hasResume={!!resume} />
        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <CardDescription>Continue or review past attempts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 && (
              <div className="text-sm text-muted-foreground">No sessions yet.</div>
            )}
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/interview/${s.id}`}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:border-primary/40"
              >
                <div>
                  <div className="font-medium">{s.jobTitle ?? "Session"}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.status} · {s._count.questions} questions · {s.createdAt.toDateString()}
                  </div>
                </div>
                <Badge variant={s.overallScore && s.overallScore >= 80 ? "success" : "secondary"}>
                  {s.overallScore != null ? `${s.overallScore}/100` : "—"}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
