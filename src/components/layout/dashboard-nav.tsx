"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/components/admin/admin-nav";

export function DashboardNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex w-full flex-col lg:w-64 lg:shrink-0">
      <button
        type="button"
        className="flex h-14 items-center gap-2 border-b border-black/10 bg-muted px-5 font-semibold tracking-tight text-foreground lg:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="admin-nav"
      >
        <span className="flex-1 text-left">Family Market</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <aside
        id="admin-nav"
        className={cn(
          "flex-col border-b border-black/10 bg-muted lg:w-full lg:flex-1 lg:border-b-0 lg:border-r",
          open ? "flex" : "hidden",
          "lg:flex",
        )}
      >
        <div className="hidden h-16 items-center gap-2.5 border-b border-black/10 px-5 lg:flex">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-sm font-extrabold text-white ring-1 ring-black/5"
          >
            FM
          </span>
          <span className="text-base font-bold">Family Market</span>
        </div>

        <nav aria-label="Navigation admin" className="flex-1 p-3">
          <ul className="flex flex-col gap-1">
            {ADMIN_NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground",
                      active &&
                        "bg-gold-500 text-white hover:bg-gold-600 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}