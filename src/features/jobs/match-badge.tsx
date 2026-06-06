import { cn } from "@/lib/utils";

export function MatchBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const tone =
    score >= 80 ? "bg-success/15 text-success ring-success/30"
    : score >= 65 ? "bg-primary/15 text-primary ring-primary/30"
    : score >= 45 ? "bg-warning/15 text-warning ring-warning/30"
    : "bg-destructive/10 text-destructive ring-destructive/30";
  const sz =
    size === "lg" ? "px-3 py-1 text-sm" :
    size === "sm" ? "px-1.5 py-0 text-[10px]" :
    "px-2 py-0.5 text-xs";
  return (
    <span className={cn("inline-flex items-center rounded-full font-semibold ring-1 ring-inset", tone, sz)}>
      {score}% match
    </span>
  );
}
