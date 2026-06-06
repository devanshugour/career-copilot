import Link from "next/link";
import { requireSession } from "@/services/auth/session";
import { resumeRepo } from "@/services/resume/repository";
import { UploadDropzone } from "@/features/resume/upload-dropzone";
import { ResumeProfileView } from "@/features/resume/resume-profile-view";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import type { ResumeProfile } from "@/types/resume";

export default async function ResumePage() {
  const session = await requireSession();
  const resume = await resumeRepo.getActive(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resume</h1>
          <p className="text-muted-foreground">Upload your resume to unlock AI-powered analysis.</p>
        </div>
        {resume && (
          <Button asChild><Link href={ROUTES.resumeAnalyze}>Run Resume vs JD</Link></Button>
        )}
      </div>

      {!resume ? (
        <UploadDropzone />
      ) : (
        <>
          <ResumeProfileView profile={resume.parsedProfile as unknown as ResumeProfile} fileName={resume.fileName} />
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            Want to upload a new version? Drop a new PDF below — your previous resume will be archived.
          </div>
          <UploadDropzone />
        </>
      )}
    </div>
  );
}
