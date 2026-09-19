"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

import { t } from "@/lib/i18n/translations";
import type { NavigationItem, Locale } from "@/types";
import { NavLinks } from "./site-nav";
import { LocaleSwitcher } from "./locale-switcher";

export function MobileNav({
  items,
  locale,
}: {
  items: NavigationItem[];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? t(locale, "navCloseMenu") : t(locale, "navMenu")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t(locale, "navCloseMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-x-0 top-full z-30 h-[calc(100dvh-100%)] bg-black/20 lg:hidden"
          />
          <nav
            id="mobile-nav"
            aria-label={t(locale, "navMenu")}
            className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-100%)] overflow-y-auto border-t border-black/10 bg-surface px-4 pb-4 pt-2 shadow-lg lg:hidden"
          >
            <NavLinks
              items={items}
              variant="mobile"
              onNavigate={() => setOpen(false)}
            />
            <div className="mt-3 flex justify-end border-t border-black/10 pt-3">
              <LocaleSwitcher locale={locale} />
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}