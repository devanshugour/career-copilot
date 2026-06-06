"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial } from "./score-radial";
import type { JdAnalysis } from "@/types/analysis";

export function JdAnalyzer({ hasResume }: { hasResume: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<JdAnalysis | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasResume) {
      toast.error("Upload a resume first.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: fd.get("jobTitle"),
        jobDescription: fd.get("jobDescription"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Analysis failed" }));
      toast.error(j.error ?? "Analysis failed");
      return;
    }
    setResult((await res.json()) as JdAnalysis);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Paste a job description</CardTitle>
          <CardDescription>We'll match it against your active resume.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" name="jobTitle" placeholder="Senior React Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job description</Label>
              <Textarea id="jobDescription" name="jobDescription" rows={14} required placeholder="Paste the full job description here…" />
            </div>
            <Button type="submit" disabled={loading || !hasResume} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Analyze
            </Button>
            {!hasResume && (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Upload a resume on the Resume page before analyzing.
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {!result && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/30 p-12 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 text-primary/60" />
            <div>Your match report will appear here.</div>
          </div>
        )}
        {loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border bg-card p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-muted-foreground">Crunching ATS signals…</div>
          </div>
        )}
        {result && <AnalysisResult result={result} />}
      </div>
    </div>
  );
}

function AnalysisResult({ result }: { result: JdAnalysis }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Verdict</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ScoreRadial value={result.matchPercentage} label="Match" />
            <ScoreRadial value={result.atsScore} label="ATS score" />
          </div>
          <p className="text-sm text-muted-foreground">{result.verdict}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="mb-2 text-xs font-medium uppercase text-success">Matched</div>
            <div className="flex flex-wrap gap-1.5">
              {result.matchedSkills.length === 0 && <span className="text-muted-foreground">None</span>}
              {result.matchedSkills.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase text-destructive">Missing</div>
            <div className="flex flex-wrap gap-1.5">
              {result.missingSkills.length === 0 && <span className="text-muted-foreground">None — great fit</span>}
              {result.missingSkills.map((s) => <Badge key={s} variant="destructive">{s}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Resume optimizations</CardTitle></CardHeader>
        <CardContent>
          <ul className="ml-5 list-disc space-y-2 text-sm text-muted-foreground">
            {result.resumeOptimizations.map((o, i) => <li key={i}>{o}</li>)}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Learning roadmap</CardTitle></CardHeader>
        <CardContent>
          {result.learningRoadmap.length === 0 ? (
            <div className="text-sm text-muted-foreground">You're already strong here.</div>
          ) : (
            <ul className="space-y-3">
              {result.learningRoadmap.map((r) => (
                <li key={r.skill} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{r.skill}</div>
                    <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "warning" : "secondary"}>
                      {r.priority} · {r.durationWeeks}w
                    </Badge>
                  </div>
                  <ul className="ml-5 mt-2 list-disc text-xs text-muted-foreground">
                    {r.resources.map((res, i) => <li key={i}>{res}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
