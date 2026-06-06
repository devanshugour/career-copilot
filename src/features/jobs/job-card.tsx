"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, MapPin, Briefcase, Building2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatSalary, relativeTime } from "@/lib/utils";
import type { JobListItem } from "@/types/jobs";
import { ROUTES } from "@/config/routes";
import { MatchBadge } from "./match-badge";

export function JobCard({ job, scoreBadge }: { job: JobListItem; scoreBadge?: React.ReactNode }) {
  const [saved, setSaved] = React.useState(!!job.saved);
  const [pending, setPending] = React.useState(false);

  async function toggleSave() {
    setPending(true);
    const res = await fetch("/api/jobs/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Could not update saved jobs");
      return;
    }
    const j = (await res.json()) as { saved: boolean };
    setSaved(j.saved);
    toast.success(j.saved ? "Saved to your list" : "Removed from saved");
  }

  return (
    <Card className="flex h-full flex-col transition hover:border-primary/40">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <Link href={ROUTES.jobDetail(job.id)} className="font-semibold leading-tight hover:underline">
              {job.title}
            </Link>
            <div className="text-sm text-muted-foreground">{job.company.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scoreBadge}
          {typeof job.matchScore === "number" && <MatchBadge score={job.matchScore} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSave}
            disabled={pending}
            aria-label={saved ? "Unsave" : "Save"}
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
          <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.experienceLevel}</span>
          <Badge variant="outline">{job.workMode}</Badge>
          <Badge variant="outline">{job.jobType.replace("_", " ")}</Badge>
        </div>
        <div className="text-sm font-medium">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</div>
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((s) => (
            <Badge key={s.name} variant="secondary">{s.name}</Badge>
          ))}
          {job.skills.length > 5 && (
            <Badge variant="secondary">+{job.skills.length - 5}</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{relativeTime(job.postedAt)}</span>
        <Button asChild size="sm" variant="outline">
          <Link href={ROUTES.jobDetail(job.id)}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
