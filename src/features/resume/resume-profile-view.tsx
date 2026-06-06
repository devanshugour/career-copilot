import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeProfile } from "@/types/resume";

export function ResumeProfileView({ profile, fileName }: { profile: ResumeProfile; fileName: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{profile.fullName ?? "Your resume"}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {fileName} · {profile.totalYearsExperience} yrs experience
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">{profile.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Skill matrix</CardTitle></CardHeader>
          <CardContent>
            {profile.skills.length === 0 ? (
              <div className="text-sm text-muted-foreground">No skills detected.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <Badge key={s.name} variant="secondary">{s.name} · {s.years}y</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {profile.experience.map((e, i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="font-medium">{e.title} <span className="text-muted-foreground">@ {e.company}</span></div>
                <div className="text-xs text-muted-foreground">{e.startDate ?? "—"} – {e.current ? "Present" : e.endDate ?? "—"}</div>
                <ul className="ml-5 mt-2 list-disc text-sm text-muted-foreground">
                  {e.highlights.slice(0, 3).map((h, j) => <li key={j}>{h}</li>)}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Education</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile.education.length === 0 ? (
              <div className="text-sm text-muted-foreground">No education entries detected.</div>
            ) : profile.education.map((e, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{e.degree}</span> · <span className="text-muted-foreground">{e.school}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile.projects.length === 0 ? (
              <div className="text-sm text-muted-foreground">No projects detected.</div>
            ) : profile.projects.map((p, i) => (
              <div key={i} className="text-sm">
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground">{p.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
