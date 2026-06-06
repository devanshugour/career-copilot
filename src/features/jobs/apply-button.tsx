"use client";

import * as React from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ApplyButton({ jobId }: { jobId: string }) {
  const [applied, setApplied] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function apply() {
    setPending(true);
    const res = await fetch("/api/jobs/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setPending(false);
    if (!res.ok) return toast.error("Could not apply");
    setApplied(true);
    toast.success("Application submitted");
  }

  return (
    <Button onClick={apply} disabled={pending || applied}>
      {applied ? <Check /> : <Send />}
      {applied ? "Applied" : "Apply"}
    </Button>
  );
}
