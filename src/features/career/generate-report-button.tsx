"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GenerateReportButton({ hasResume }: { hasResume: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  async function go() {
    if (!hasResume) return toast.error("Upload a resume first.");
    setLoading(true);
    const res = await fetch("/api/career/readiness", { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Failed" }));
      return toast.error(j.error ?? "Failed");
    }
    toast.success("Career report generated.");
    router.refresh();
  }
  return (
    <Button onClick={go} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Generate latest report
    </Button>
  );
}
