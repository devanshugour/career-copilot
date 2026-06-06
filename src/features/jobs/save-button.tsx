"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SaveButton({ jobId, initialSaved }: { jobId: string; initialSaved: boolean }) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);
  async function toggle() {
    setPending(true);
    const res = await fetch("/api/jobs/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setPending(false);
    if (!res.ok) return toast.error("Could not update");
    const { saved: next } = (await res.json()) as { saved: boolean };
    setSaved(next);
    toast.success(next ? "Saved" : "Removed from saved");
  }
  return (
    <Button variant="outline" onClick={toggle} disabled={pending}>
      {saved ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
