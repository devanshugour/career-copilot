import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin, Briefcase } from "lucide-react";
import { requireSession } from "@/services/auth/session";
import { jobsRepo } from "@/services/jobs/repository";
import { resumeRepo } from "@/services/resume/repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ApplyButton } from "@/features/jobs/apply-button";
import { SaveButton } from "@/features/jobs/save-button";
import { MatchPanel } from "@/features/jobs/match-panel";
import { MatchBadge } from "@/features/jobs/match-badge";
import { scoreJobForResume } from "@/services/jobs/scorer";
import { formatSalary } from "@/lib/utils";
import type { ResumeProfile } from "@/types/resume";

export default async function JobDetailPage(props: PageProps<"/jobs/[id]">) {
  const session = await requireSession();
  const { id } = await props.params;
  const [job, resume] = await Promise.all([
    jobsRepo.detail(id, session.user.id),
    resumeRepo.getActive(session.user.id),
  ]);
  if (!job) notFound();

  let quickScore: number | null = null;
  if (resume) {
    const profile = resume.parsedProfile as unknown as ResumeProfile;
    quickScore = scoreJobForResume({
      resumeSkills: resume.skills.map((s) => ({ slug: s.skill.slug, years: s.years })),
      resumeYears: profile?.totalYearsExperience ?? 0,
      jobSkills: job.skills.map((s) => ({ slug: s.skill.slug, required: s.required, weight: s.weight })),
      jobLevel: job.experienceLevel,
    }).score;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm"><Link href="/jobs">← All jobs</Link></Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <div className="mt-1 text-muted-foreground">{job.company.name}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.experienceLevel}</span>
                  <Badge variant="outline">{job.workMode}</Badge>
                  <Badge variant="outline">{job.jobType.replace("_", " ")}</Badge>
                  {quickScore !== null && <MatchBadge score={quickScore} size="lg" />}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SaveButton jobId={job.id} initialSaved={!!job.saved} />
              <ApplyButton jobId={job.id} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="text-xs uppercase text-muted-foreground">Compensation</div>
            <div className="mt-1 text-xl font-semibold">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</div>
            <div className="text-xs text-muted-foreground">{job.experienceMin}-{job.experienceMax} years</div>
          </div>

          <section className="space-y-2">
            <h3 className="font-semibold">About the role</h3>
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{job.description}</p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h3 className="font-semibold">Responsibilities</h3>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Required skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <Badge key={s.skillId} variant={s.required ? "default" : "secondary"}>{s.skill.name}</Badge>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Benefits</h3>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              {job.benefits.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </section>
        </CardContent>
      </Card>

      <MatchPanel jobId={job.id} hasResume={!!resume} />
    </div>
  );
}
