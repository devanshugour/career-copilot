import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, THead, TH, TBody, TR, TD } from "@/components/common/data-table";

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { jobs: true } } },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
      <Card>
        <CardHeader><CardTitle>{companies.length} companies</CardTitle></CardHeader>
        <DataTable>
          <THead>
            <TH>Name</TH><TH>Industry</TH><TH>HQ</TH><TH>Jobs</TH>
          </THead>
          <TBody>
            {companies.map((c) => (
              <TR key={c.id}>
                <TD>{c.name}</TD><TD>{c.industry ?? "—"}</TD><TD>{c.hqLocation ?? "—"}</TD><TD>{c._count.jobs}</TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      </Card>
    </div>
  );
}
