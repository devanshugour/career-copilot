import Link from "next/link";
import { requireSession } from "@/services/auth/session";
import { jobsRepo } from "@/services/jobs/repository";
import { resumeRepo } from "@/services/resume/repository";
import { JobCard } from "@/features/jobs/job-card";
import { JobFilters } from "@/features/jobs/job-filters";
import { UploadCvCta } from "@/features/jobs/upload-cv-cta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { JobsQuery } from "@/types/jobs";

export default async function JobsPage(props: PageProps<"/jobs">) {
  const session = await requireSession();
  const sp = await props.searchParams;

  const resume = await resumeRepo.getActive(session.user.id);
  const matchEnabled = !!resume;

  const q: JobsQuery = {
    q: typeof sp.q === "string" ? sp.q : undefined,
    workMode: (typeof sp.workMode === "string" ? sp.workMode : "ALL") as JobsQuery["workMode"],
    jobType: (typeof sp.jobType === "string" ? sp.jobType : "ALL") as JobsQuery["jobType"],
    level: (typeof sp.level === "string" ? sp.level : "ALL") as JobsQuery["level"],
    page: typeof sp.page === "string" ? Number(sp.page) : 1,
    sort: (typeof sp.sort === "string"
      ? sp.sort
      : matchEnabled
      ? "match"
      : "recent") as JobsQuery["sort"],
  };

  const { items, total, page, totalPages } = await jobsRepo.list(q, session.user.id);

  const baseParams = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v && v !== "ALL" && k !== "page" && baseParams.set(k, String(v)));

  const headline = matchEnabled
    ? `${total} jobs · ranked against your CV`
    : `${total} open roles${q.q ? ` matching "${q.q}"` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">{headline}</p>
        </div>
        <div className="flex items-center gap-2">
          {matchEnabled && <Badge variant="success">CV loaded</Badge>}
          <Button asChild variant="outline"><Link href="/jobs/saved">Saved</Link></Button>
        </div>
      </div>

      {!matchEnabled && <UploadCvCta />}

      <JobFilters matchEnabled={matchEnabled} />

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No jobs matched your filters.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link href={`/jobs?${new URLSearchParams({ ...Object.fromEntries(baseParams), page: String(page - 1) })}`}>
                  Prev
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
                <Link href={`/jobs?${new URLSearchParams({ ...Object.fromEntries(baseParams), page: String(page + 1) })}`}>
                  Next
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
