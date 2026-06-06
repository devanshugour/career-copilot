import { requireSession } from "@/services/auth/session";
import { resumeRepo } from "@/services/resume/repository";
import { JdAnalyzer } from "@/features/career/jd-analyzer";

export default async function AnalyzePage() {
  const session = await requireSession();
  const resume = await resumeRepo.getActive(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resume vs Job Description</h1>
        <p className="text-muted-foreground">ATS score, missing skills, and a learning roadmap.</p>
      </div>
      <JdAnalyzer hasResume={!!resume} />
    </div>
  );
}
