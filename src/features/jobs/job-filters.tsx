"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const WORK_MODES = ["ALL", "ONSITE", "HYBRID", "REMOTE"] as const;
const JOB_TYPES = ["ALL", "FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"] as const;
const LEVELS = ["ALL", "ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD"] as const;

export function JobFilters({ matchEnabled }: { matchEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v && v !== "ALL") next.set(k, v);
      else next.delete(k);
    });
    next.delete("page");
    router.push(`/jobs?${next.toString()}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px_180px] lg:items-end">
      <div className="space-y-1">
        <Label htmlFor="q">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="q"
            defaultValue={params.get("q") ?? ""}
            placeholder="Title, company, skill, location"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
            }}
          />
        </div>
      </div>
      <FilterSelect label="Work mode" value={params.get("workMode") ?? "ALL"} onChange={(v) => update({ workMode: v })} options={WORK_MODES} />
      <FilterSelect label="Job type" value={params.get("jobType") ?? "ALL"} onChange={(v) => update({ jobType: v })} options={JOB_TYPES} />
      <FilterSelect label="Level" value={params.get("level") ?? "ALL"} onChange={(v) => update({ level: v })} options={LEVELS} />
      <FilterSelect
        label="Sort by"
        value={params.get("sort") ?? (matchEnabled ? "match" : "recent")}
        onChange={(v) => update({ sort: v })}
        options={matchEnabled ? (["match", "recent", "salary"] as const) : (["recent", "salary"] as const)}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
