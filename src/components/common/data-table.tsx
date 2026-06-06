import * as React from "react";
import { cn } from "@/lib/utils";

export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr>{children}</tr></thead>;
}

export function TH({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y">{children}</tbody>;
}

export function TR({ children }: { children: React.ReactNode }) {
  return <tr className="transition hover:bg-muted/30">{children}</tr>;
}

export function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}
