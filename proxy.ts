// Next.js 16: middleware is now `proxy.ts` at project root.
// Auth.js v5 ships an `auth` proxy helper that wraps the request with session info
// and calls the `authorized` callback in auth.config.

import NextAuth from "next-auth";
import { authConfig } from "@/services/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Run on all routes except Next internals, static assets, and the auth API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
