import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminHome() {
  const [users, jobs, companies, skills, applications] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.company.count(),
    prisma.skill.count(),
    prisma.jobApplication.count(),
  ]);
  const items = [
    { label: "Users", value: users, href: "/admin/users" },
    { label: "Jobs", value: jobs, href: "/admin/jobs" },
    { label: "Companies", value: companies, href: "/admin/companies" },
    { label: "Skills", value: skills, href: "/admin/skills" },
    { label: "Applications", value: applications, href: "/admin/jobs" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition hover:border-primary/40">
              <CardHeader><CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{s.value}</div></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
