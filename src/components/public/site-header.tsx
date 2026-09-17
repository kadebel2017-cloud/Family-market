import Link from "next/link";
import { Phone, Search } from "lucide-react";

import { t } from "@/lib/i18n/translations";
import { safeTelHref } from "@/lib/public/site";
import type { NavigationItem } from "@/types";
import type { PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { StoreLogo, storeName } from "./store-logo";
import { NavLinks } from "./site-nav";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";

export function SiteHeader({
  settings,
  locale,
}: {
  settings: PublicSettings | null;
  locale: Locale;
}) {
  const navItems: NavigationItem[] = [
    { label: t(locale, "navHome"), href: "/" },
    { label: t(locale, "navProducts"), href: "/products" },
    { label: t(locale, "navCategories"), href: "/categories" },
    { label: t(locale, "navPromotions"), href: "/promotions" },
    { label: t(locale, "navAbout"), href: "/about" },
    { label: t(locale, "navContact"), href: "/contact" },
  ];

  const phoneHref = safeTelHref(settings?.phone);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={storeName(settings, locale)}
          className="min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <StoreLogo settings={settings} locale={locale} />
        </Link>

        <NavLinks items={navItems} />

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/products"
            aria-label={t(locale, "searchButton")}
            title={t(locale, "searchButton")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <Search className="h-4 w-4" aria-hidden />
          </Link>

          {phoneHref ? (
            <a
              href={phoneHref}
              className="hidden items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 md:inline-flex"
            >
              <Phone className="h-4 w-4 text-gold-600" aria-hidden />
              <span>{settings?.phone}</span>
            </a>
          ) : null}

          <LocaleSwitcher locale={locale} />

          <MobileNav items={navItems} locale={locale} />
        </div>
      </div>
    </header>
  );
}