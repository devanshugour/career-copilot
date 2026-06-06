import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";
import { ROUTES } from "@/config/routes";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Career Copilot</p>
      </div>
      <Suspense fallback={<div className="h-[260px] animate-pulse rounded-md bg-muted" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href={ROUTES.register} className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
