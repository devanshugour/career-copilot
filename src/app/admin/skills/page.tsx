import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminSkillsPage() {
  const skills = await prisma.skill.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { jobs: true, resumes: true } } },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
      <Card>
        <CardHeader><CardTitle>{skills.length} skills</CardTitle></CardHeader>
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div className="font-medium">{s.name}</div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{s._count.jobs} jobs</Badge>
                <Badge variant="outline">{s._count.resumes} resumes</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
