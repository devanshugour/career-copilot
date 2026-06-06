import Link from "next/link";
import { CloudUpload, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

export function UploadCvCta() {
  return (
    <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="rounded-full bg-primary/15 p-3 text-primary">
          <CloudUpload className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Upload your CV to personalize this page
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Every job will show a match % against your profile and rank by how well it fits you.
            On the detail page you'll get pros / cons, the exact skills to learn, and a draft cover-letter email.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={ROUTES.resume}>Upload CV</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
