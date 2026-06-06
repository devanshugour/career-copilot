import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, THead, TH, TBody, TR, TD } from "@/components/common/data-table";

export default async function AdminJobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { postedAt: "desc" },
    take: 50,
    include: { company: { select: { name: true } }, _count: { select: { applications: true, savedBy: true } } },
  });
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
        <Button asChild variant="outline"><Link href="/jobs">View as user</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>{jobs.length} latest jobs</CardTitle></CardHeader>
        <DataTable>
          <THead>
            <TH>Title</TH><TH>Company</TH><TH>Type</TH><TH>Mode</TH><TH>Applications</TH><TH>Saved</TH><TH>Status</TH>
          </THead>
          <TBody>
            {jobs.map((j) => (
              <TR key={j.id}>
                <TD>{j.title}</TD>
                <TD>{j.company.name}</TD>
                <TD><Badge variant="outline">{j.jobType.replace("_", " ")}</Badge></TD>
                <TD><Badge variant="outline">{j.workMode}</Badge></TD>
                <TD>{j._count.applications}</TD>
                <TD>{j._count.savedBy}</TD>
                <TD>
                  <Badge variant={j.active ? "success" : "secondary"}>{j.active ? "Active" : "Inactive"}</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      </Card>
    </div>
  );
}
