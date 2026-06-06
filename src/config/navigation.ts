import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Sparkles,
  MessageSquare,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

// Admin entry intentionally omitted — admin routes still reachable by URL.
export const APP_NAV: NavItem[] = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Jobs", href: ROUTES.jobs, icon: Briefcase },
  { label: "Resume", href: ROUTES.resume, icon: FileText },
  { label: "Career Report", href: ROUTES.career, icon: Sparkles },
  { label: "Interview", href: ROUTES.interview, icon: MessageSquare },
  { label: "Profile", href: ROUTES.profile, icon: User },
];
