"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function StartInterviewForm({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hasResume) return toast.error("Upload a resume first.");
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const res = await fetch("/api/interview/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: fd.get("jobTitle"),
        jdSnippet: fd.get("jdSnippet") || undefined,
        count: Number(fd.get("count") ?? 5),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Failed" }));
      return toast.error(j.error ?? "Failed");
    }
    const sess = (await res.json()) as { id: string };
    toast.success("Session created.");
    router.push(`/interview/${sess.id}`);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a new session</CardTitle>
        <CardDescription>We'll generate technical, behavioral, scenario and HR questions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Target role</Label>
            <Input id="jobTitle" name="jobTitle" defaultValue="Senior Software Engineer" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jdSnippet">Job description (optional)</Label>
            <Textarea id="jdSnippet" name="jdSnippet" rows={6} placeholder="Paste a JD for more targeted questions…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="count">Number of questions</Label>
            <Input id="count" name="count" type="number" min={3} max={10} defaultValue={5} />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !hasResume}>
            {loading ? <Loader2 className="animate-spin" /> : <Play />}
            Generate session
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
