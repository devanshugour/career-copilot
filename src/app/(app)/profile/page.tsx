import { requireSession } from "@/services/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { resumes: true, savedJobs: true, applications: true } } },
  });
  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span><span>{user.name ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span><span>{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span><Badge variant="secondary">{user.role}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Joined</span><span>{user.createdAt.toDateString()}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div><div className="text-2xl font-bold">{user._count.resumes}</div><div className="text-xs text-muted-foreground">Resumes</div></div>
          <div><div className="text-2xl font-bold">{user._count.savedJobs}</div><div className="text-xs text-muted-foreground">Saved jobs</div></div>
          <div><div className="text-2xl font-bold">{user._count.applications}</div><div className="text-xs text-muted-foreground">Applications</div></div>
        </CardContent>
      </Card>
    </div>
  );
}
