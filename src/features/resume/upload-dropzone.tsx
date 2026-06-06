"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported.");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: "Upload failed" }));
      toast.error(j.error ?? "Upload failed");
      return;
    }
    toast.success("Resume parsed.");
    router.refresh();
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card/50 p-12 text-center transition",
        dragOver && "border-primary bg-primary/5",
      )}
    >
      <div className="rounded-full bg-primary/10 p-3">
        {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <CloudUpload className="h-8 w-8 text-primary" />}
      </div>
      <div>
        <div className="font-medium">{loading ? "Parsing your resume…" : "Drop your resume PDF here"}</div>
        <div className="text-sm text-muted-foreground">PDF, up to 5 MB</div>
      </div>
      <Button onClick={() => inputRef.current?.click()} disabled={loading} variant="outline">
        <FileText /> Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
