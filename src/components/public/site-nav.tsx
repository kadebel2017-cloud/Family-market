"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "@/types";

export function NavLinks({
  items,
  variant = "desktop",
  onNavigate,
}: {
  items: NavigationItem[];
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const itemClasses =
    variant === "desktop"
      ? "relative inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
      : "block rounded-md border-s-2 px-4 py-3 text-base font-medium transition-colors";

  const idleClasses =
    variant === "desktop"
      ? "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      : "border-transparent text-foreground hover:bg-black/5";

  const activeClasses =
    variant === "desktop"
      ? "text-foreground"
      : "border-gold-500 bg-gold-50 text-foreground";

  return (
    <ul
      className={
        variant === "desktop"
          ? `hidden items-center gap-1 lg:flex`
          : "flex flex-col gap-1"
      }
    >
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(itemClasses, active ? activeClasses : idleClasses)}
            >
              {item.label}
              {active && variant === "desktop" ? (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-500"
                />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}