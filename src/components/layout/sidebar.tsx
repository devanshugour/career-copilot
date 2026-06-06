"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { APP_NAV } from "@/config/navigation";
import { APP } from "@/config/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-card/40 lg:flex lg:flex-col">
      <Link href="/" className="flex h-16 items-center gap-2 border-b px-6 text-lg font-semibold">
        <Sparkles className="h-5 w-5 text-primary" />
        {APP.name}
      </Link>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {APP_NAV.filter((i) => (i.adminOnly ? isAdmin : true)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground">
        {APP.tagline}
      </div>
    </aside>
  );
}
