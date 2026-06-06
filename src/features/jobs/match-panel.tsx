"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles, Loader2, ThumbsUp, ThumbsDown, GraduationCap,
  Target, Copy, Check, RefreshCw, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScoreRadial } from "@/features/career/score-radial";
import { ROUTES } from "@/config/routes";
import type { ApplicationGuide } from "@/types/analysis";

type GuideResp = { guide: ApplicationGuide; cached: boolean; resumeId: string; jobId: string } | { guide: null };

const VERDICT_TONE: Record<ApplicationGuide["verdict"], { label: string; variant: "success" | "default" | "warning" | "destructive" }> = {
  strong:     { label: "Strong fit — apply",   variant: "success" },
  good:       { label: "Good fit",              variant: "default" },
  stretch:    { label: "Stretch — possible",   variant: "warning" },
  long_shot:  { label: "Long shot",             variant: "destructive" },
};

export function MatchPanel({ jobId, hasResume }: { jobId: string; hasResume: boolean }) {
  const [guide, setGuide] = React.useState<ApplicationGuide | null>(null);
  const [cached, setCached] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [primed, setPrimed] = React.useState(false);

  // On mount, probe cache (cheap GET, no AI call)
  React.useEffect(() => {
    if (!hasResume) return;
    let stale = false;
    (async () => {
      const res = await fetch(`/api/jobs/${jobId}/match`);
      if (!res.ok || stale) return;
      const j = (await res.json()) as GuideResp;
      if (j.guide) {
        setGuide(j.guide);
        setCached(true);
      }
      setPrimed(true);
    })();
    return () => { stale = true; };
  }, [jobId, hasResume]);

  async function runAnalysis(force = false) {
    setLoading(true);
    const res = await fetch(`/api/jobs/${jobId}/match${force ? "?force=1" : ""}`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Failed" }));
      toast.error(j.error ?? "Failed");
      return;
    }
    const j = (await res.json()) as { guide: ApplicationGuide; cached: boolean };
    setGuide(j.guide);
    setCached(false);
    toast.success("Match analysis ready");
  }

  if (!hasResume) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Am I a match for this job?</CardTitle>
          <CardDescription>Upload your CV first — we'll score your fit and draft a tailored cover letter.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link href={ROUTES.resume}>Upload CV</Link></Button>
        </CardContent>
      </Card>
    );
  }

  if (!guide) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Am I a match for this job?</CardTitle>
          <CardDescription>
            We'll compare your CV against this exact role and give you match %, pros / cons, what to learn, practice tips, and a draft cover-letter email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => runAnalysis(false)} disabled={loading || !primed}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Analyzing — this can take ~10s" : "Run match analysis"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <FullPanel guide={guide} cached={cached} loading={loading} onRefresh={() => runAnalysis(true)} />;
}

function FullPanel({
  guide,
  cached,
  loading,
  onRefresh,
}: {
  guide: ApplicationGuide;
  cached: boolean;
  loading: boolean;
  onRefresh: () => void;
}) {
  const v = VERDICT_TONE[guide.verdict];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Your match for this job</CardTitle>
            <CardDescription>
              {cached ? "Cached result." : "Fresh analysis."} Update your CV or run again to refresh.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Re-run
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid items-center gap-6 sm:grid-cols-[160px_1fr]">
          <ScoreRadial value={guide.matchPercentage} label="Match" />
          <div className="space-y-3">
            <Badge variant={v.variant}>{v.label}</Badge>
            <p className="text-sm leading-6 text-muted-foreground">{guide.readinessAssessment}</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-success"><ThumbsUp className="h-4 w-4" /> Why you should apply</h4>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
              {guide.pros.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive"><ThumbsDown className="h-4 w-4" /> Risks to know</h4>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
              {guide.cons.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-success">Matched skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {guide.matchedSkills.length === 0 && <span className="text-sm text-muted-foreground">None matched.</span>}
              {guide.matchedSkills.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase text-destructive">Missing skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {guide.missingSkills.length === 0 && <span className="text-sm text-muted-foreground">None — great fit.</span>}
              {guide.missingSkills.map((s) => <Badge key={s} variant="destructive">{s}</Badge>)}
            </div>
          </div>
        </div>

        {guide.skillsToLearn.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold"><GraduationCap className="h-4 w-4 text-primary" /> What to learn before applying</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {guide.skillsToLearn.map((s) => (
                  <div key={s.skill} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{s.skill}</div>
                      <Badge variant={s.priority === "high" ? "destructive" : s.priority === "medium" ? "warning" : "secondary"}>
                        {s.priority} · {s.durationWeeks}w
                      </Badge>
                    </div>
                    <ul className="ml-5 mt-2 list-disc text-xs text-muted-foreground">
                      {s.resources.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {guide.practiceTips.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-primary" /> Practice in the next 2-4 weeks</h4>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
              {guide.practiceTips.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}

        <Separator />

        <CoverLetterBlock email={guide.coverLetterEmail} />
      </CardContent>
    </Card>
  );
}

function CoverLetterBlock({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-primary" /> Draft cover-letter email</h4>
        <Button size="sm" variant="outline" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-foreground">{email}</pre>
    </div>
  );
}
