"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="border-b bg-background/80 backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 overflow-x-auto px-4 py-2">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-tight"
        >
          Musicd
        </Link>
        <ul className="flex items-center gap-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2 py-1 whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
