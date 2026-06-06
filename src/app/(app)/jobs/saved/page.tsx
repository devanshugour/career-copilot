import Link from "next/link";
import { requireSession } from "@/services/auth/session";
import { jobsRepo } from "@/services/jobs/repository";
import { JobCard } from "@/features/jobs/job-card";
import { Button } from "@/components/ui/button";

export default async function SavedJobsPage() {
  const session = await requireSession();
  const items = await jobsRepo.listSaved(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved jobs</h1>
          <p className="text-muted-foreground">{items.length} saved</p>
        </div>
        <Button asChild variant="outline"><Link href="/jobs">All jobs</Link></Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          You haven't saved any jobs yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((j) => (
            <JobCard
              key={j.id}
              job={{
                id: j.id, title: j.title, slug: j.slug, location: j.location,
                workMode: j.workMode, jobType: j.jobType, experienceLevel: j.experienceLevel,
                salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency,
                postedAt: j.postedAt, company: j.company, skills: j.skills, saved: true,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
