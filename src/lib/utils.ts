import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min: number | null, max: number | null, currency = "INR") {
  if (!min && !max) return "Salary not disclosed";
  const fmt = (n: number) => {
    if (currency === "INR") return `₹${(n / 100000).toFixed(1)}L`;
    return `${currency} ${n.toLocaleString()}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max)!);
}

export function relativeTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
