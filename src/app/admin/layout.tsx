import Link from "next/link";
import { Shield, Briefcase, Users, Building2, Tags } from "lucide-react";
import { requireAdmin } from "@/services/auth/session";
import { Topbar } from "@/components/layout/topbar";
import { APP } from "@/config/constants";

const ADMIN_NAV = [
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/skills", label: "Skills", icon: Tags },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-card/40 lg:flex lg:flex-col">
        <Link href="/admin" className="flex h-16 items-center gap-2 border-b px-6 text-lg font-semibold">
          <Shield className="h-5 w-5 text-primary" /> {APP.name} Admin
        </Link>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {ADMIN_NAV.map((i) => {
            const Icon = i.icon;
            return (
              <Link key={i.href} href={i.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                <Icon className="h-4 w-4" />{i.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
