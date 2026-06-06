import { redirect } from "next/navigation";
import { auth } from "./auth";
import { ROUTES } from "@/config/routes";

export async function getSession() {
  return auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect(ROUTES.login);
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect(ROUTES.dashboard);
  return session;
}
