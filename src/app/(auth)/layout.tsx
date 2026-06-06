import Link from "next/link";
import { Sparkles } from "lucide-react";
import { APP } from "@/config/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary/15 via-background to-background p-10 lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          {APP.name}
        </Link>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">From Resume to Offer.</h2>
          <p className="max-w-md text-muted-foreground">
            Your AI Career Copilot ranks jobs against your resume, audits ATS readiness,
            and rehearses interviews so you walk in prepared.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Career Copilot</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
