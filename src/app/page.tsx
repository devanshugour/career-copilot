import Link from "next/link";
import { ArrowRight, Sparkles, FileText, Briefcase, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { APP } from "@/config/constants";
import { ROUTES } from "@/config/routes";

const features = [
  {
    icon: FileText,
    title: "Resume parsing",
    body: "Upload a PDF; AI extracts skills, experience, education and projects into a structured profile.",
  },
  {
    icon: Target,
    title: "Resume vs JD analyzer",
    body: "Get a match %, ATS score, missing skills, optimization tips and a learning roadmap.",
  },
  {
    icon: Briefcase,
    title: "AI-ranked jobs",
    body: "Live job board ranks roles against your profile with rationale you can defend in interviews.",
  },
  {
    icon: MessageSquare,
    title: "Interview practice",
    body: "Generate technical, HR, behavioral and scenario questions; score your answers with feedback.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-primary" /> {APP.name}
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.login}>Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.register}>Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center lg:py-28">
          <Badge variant="secondary" className="mb-5">AI for Employability</Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            From Resume to Offer.<br />
            <span className="text-primary">Your AI Career Copilot.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Upload your resume. We analyze ATS-readiness, surface skill gaps, rank jobs against you,
            and rehearse interviews — so you walk in prepared.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link href={ROUTES.register}>
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTES.login}>Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP.name} — Built for the AI for Impact hackathon.
      </footer>
    </div>
  );
}
