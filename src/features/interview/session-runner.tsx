"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { InterviewQuestionType } from "@prisma/client";

type Q = {
  id: string;
  order: number;
  type: InterviewQuestionType;
  prompt: string;
  rubric: string | null;
  answer: {
    answer: string;
    score: number;
    accuracy: number;
    communication: number;
    completeness: number;
    relevance: number;
    strengths: string[];
    weaknesses: string[];
    suggestedAnswer: string;
  } | null;
};

export function SessionRunner({ session }: { session: { id: string; jobTitle: string | null; questions: Q[]; overallScore: number | null } }) {
  const router = useRouter();
  const [questions, setQuestions] = React.useState(session.questions);
  const [activeIdx, setActiveIdx] = React.useState(() => {
    const i = questions.findIndex((q) => !q.answer);
    return i === -1 ? 0 : i;
  });
  const [text, setText] = React.useState(questions[activeIdx]?.answer?.answer ?? "");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setText(questions[activeIdx]?.answer?.answer ?? "");
  }, [activeIdx, questions]);

  const completed = questions.filter((q) => q.answer).length;
  const total = questions.length;
  const progress = total ? (completed / total) * 100 : 0;
  const active = questions[activeIdx];

  async function submit() {
    if (!active) return;
    setLoading(true);
    const res = await fetch("/api/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: active.id, answer: text }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Failed" }));
      return toast.error(j.error ?? "Failed");
    }
    const e = (await res.json()) as Q["answer"];
    setQuestions((prev) => prev.map((q, i) => (i === activeIdx ? { ...q, answer: e } : q)));
    toast.success("Answer evaluated.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{session.jobTitle ?? "Interview session"}</CardTitle>
              <CardDescription>{completed} of {total} answered</CardDescription>
            </div>
            {session.overallScore != null && (
              <Badge variant={session.overallScore >= 80 ? "success" : "default"}>
                Overall: {session.overallScore}/100
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader><CardTitle>Questions</CardTitle></CardHeader>
          <CardContent className="space-y-1 p-2">
            {questions.map((q, i) => {
              const done = !!q.answer;
              const isActive = i === activeIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveIdx(i)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Q{q.order}</span>
                    <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                  </span>
                  {done && <Check className="h-3 w-3 text-success" />}
                </button>
              );
            })}
          </CardContent>
        </Card>

        {active && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-relaxed">{active.prompt}</CardTitle>
                  <Badge variant="outline">{active.type}</Badge>
                </div>
                {active.rubric && (
                  <CardDescription className="mt-2">Hint: {active.rubric}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={8}
                  placeholder="Type your answer here…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="flex items-center justify-end gap-2">
                  <Button onClick={submit} disabled={loading || text.trim().length < 4}>
                    {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {active.answer ? "Re-evaluate" : "Submit answer"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {active.answer && <EvaluationCard a={active.answer} />}
          </div>
        )}
      </div>
    </div>
  );
}

function EvaluationCard({ a }: { a: NonNullable<Q["answer"]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation</CardTitle>
        <CardDescription>Score: {a.score}/100</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3 text-center text-xs">
          <MetricChip label="Accuracy" v={a.accuracy} />
          <MetricChip label="Communication" v={a.communication} />
          <MetricChip label="Completeness" v={a.completeness} />
          <MetricChip label="Relevance" v={a.relevance} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-success">Strengths</div>
          <ul className="ml-5 list-disc text-sm text-muted-foreground">
            {a.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-destructive">Weaknesses</div>
          <ul className="ml-5 list-disc text-sm text-muted-foreground">
            {a.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-primary">Suggested answer</div>
          <p className="text-sm text-muted-foreground">{a.suggestedAnswer}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricChip({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-base font-semibold">{v}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
