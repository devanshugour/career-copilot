import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, THead, TH, TBody, TR, TD } from "@/components/common/data-table";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: { resumes: true, savedJobs: true, applications: true } } },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users</h1>
      <Card>
        <CardHeader><CardTitle>{users.length} users</CardTitle></CardHeader>
        <DataTable>
          <THead>
            <TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Resumes</TH><TH>Saved</TH><TH>Applied</TH><TH>Joined</TH>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD>{u.name ?? "—"}</TD>
                <TD>{u.email}</TD>
                <TD><Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge></TD>
                <TD>{u._count.resumes}</TD>
                <TD>{u._count.savedJobs}</TD>
                <TD>{u._count.applications}</TD>
                <TD>{u.createdAt.toDateString()}</TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      </Card>
    </div>
  );
}
