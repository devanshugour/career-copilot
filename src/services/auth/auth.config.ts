import type { NextAuthConfig } from "next-auth";
import { ROUTES, ADMIN_ROUTE_PREFIX, PUBLIC_ROUTES } from "@/config/routes";

/**
 * Auth.js (NextAuth v5) base config shared between edge and node runtimes.
 * The Credentials provider lives in `auth.ts` (node runtime — uses bcrypt + Prisma).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: ROUTES.login,
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isPublic = PUBLIC_ROUTES.includes(pathname);
      const isAuth = !!auth?.user;
      const isAdminRoute = pathname.startsWith(ADMIN_ROUTE_PREFIX);

      if (isAdminRoute) return isAuth && auth!.user.role === "ADMIN";
      if (isPublic) return true;
      if (pathname.startsWith("/api/auth")) return true;
      return isAuth;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: "USER" | "ADMIN" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  providers: [], // credential provider added in auth.ts (node runtime)
};
