import Link from "next/link";
import { Clock, Phone, Search } from "lucide-react";

import { t } from "@/lib/i18n/translations";
import { formatTimeRange, isOpenNow } from "@/lib/public/schedule";
import { safeTelHref } from "@/lib/public/site";
import { cn } from "@/lib/utils";
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
  const openingRange = settings
    ? formatTimeRange(settings.openingTime, settings.closingTime)
    : "08:00 – 23:00";
  const isOpen = settings?.isOpenAutomatically
    ? isOpenNow(new Date(), {
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
      })
    : true;

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-surface/95 backdrop-blur">
      <div className="border-b border-black/5 bg-gold-50/70">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium text-black sm:text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-gold-600" aria-hidden />
            <span>
              {t(locale, "everyDay")} : {openingRange}
            </span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              isOpen
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOpen ? "bg-emerald-500" : "bg-red-500",
              )}
            />
            {isOpen ? t(locale, "storeOpen") : t(locale, "storeClosed")}
          </span>
        </div>
      </div>
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 pe-4 ps-0 sm:pe-6 lg:pe-8">
        <Link
          href="/"
          aria-label={storeName(settings, locale)}
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <StoreLogo settings={settings} locale={locale} size="lg" />
        </Link>

        <NavLinks items={navItems} />

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <form
            action="/products"
            role="search"
            className="hidden min-w-0 flex-1 justify-end sm:flex"
          >
            <div className="flex w-full max-w-44 items-center gap-1.5 rounded-md border border-black/10 bg-white p-1 ps-2.5 transition-shadow focus-within:ring-2 focus-within:ring-gold-500 md:max-w-56 lg:max-w-72">
              <Search
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <label htmlFor="header-search" className="sr-only">
                {t(locale, "searchPlaceholder")}
              </label>
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder={t(locale, "searchPlaceholder")}
                className="h-7 w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </form>
          <Link
            href="/products"
            aria-label={t(locale, "searchButton")}
            title={t(locale, "searchButton")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 sm:hidden"
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