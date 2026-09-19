import Link from "next/link";
import {
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import {
  t,
  pickLocalized,
} from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { formatTimeRange, isOpenNow } from "@/lib/public/schedule";
import { safeExternalUrl, safeTelHref, whatsAppHref } from "@/lib/public/site";
import type { NavigationItem } from "@/types";
import type { Locale } from "@/types";
import type { PublicSettings } from "@/lib/public/queries";
import { FacebookIcon } from "./facebook-icon";
import { storeName, StoreLogo } from "./store-logo";

const SOCIAL_LABELS: {
  key: "facebookUrl" | "instagramUrl" | "tiktokUrl";
  label: string;
}[] = [
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
  { key: "tiktokUrl", label: "TikTok" },
];

export function SiteFooter({
  settings,
  locale,
}: {
  settings: PublicSettings | null;
  locale: Locale;
}) {
  const name = storeName(settings, locale);
  const year = new Date().getFullYear();
  const address = pickLocalized(locale, settings?.addressFr, settings?.addressAr);
  const phoneHref = safeTelHref(settings?.phone);
  const whatsappUrl = whatsAppHref(settings?.whatsapp);
  const mapsUrl = safeExternalUrl(settings?.googleMapsUrl);
  const socials = SOCIAL_LABELS.map((item) => ({
    ...item,
    url: safeExternalUrl(settings?.[item.key]),
  })).filter((item) => item.url !== null);

  const navItems: NavigationItem[] = [
    { label: t(locale, "navHome"), href: "/" },
    { label: t(locale, "navProducts"), href: "/products" },
    { label: t(locale, "navCategories"), href: "/categories" },
    { label: t(locale, "navPromotions"), href: "/promotions" },
    { label: t(locale, "navAbout"), href: "/about" },
    { label: t(locale, "navContact"), href: "/contact" },
  ];

  const live =
    settings && settings.isOpenAutomatically
      ? isOpenNow(new Date(), {
          openingTime: settings.openingTime,
          closingTime: settings.closingTime,
        })
      : null;

  return (
    <footer className="border-t-4 border-gold-500 bg-black text-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4">
          <Link href="/" className="w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
            <StoreLogo settings={settings} locale={locale} dark />
          </Link>
          <p className="text-sm text-white/60">{t(locale, "footerAboutNote")}</p>
          {socials.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {socials.map(({ key, label, url }) => (
                <li key={key}>
                  <a
                    href={url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80 transition-colors hover:border-gold-400 hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  >
                    {key === "facebookUrl" ? (
                      <FacebookIcon className="h-3.5 w-3.5" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t(locale, "footerNavigation")}
          </h2>
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-white/70 transition-colors hover:text-gold-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t(locale, "footerContact")}
          </h2>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            {phoneHref ? (
              <li>
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold-300"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                  {settings?.phone}
                </a>
              </li>
            ) : null}
            {whatsappUrl ? (
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold-300"
                >
                  <MessageCircle
                    className="h-4 w-4 shrink-0 text-gold-400"
                    aria-hidden
                  />
                  {t(locale, "contactWhatsappAction")}
                </a>
              </li>
            ) : null}
            {address ? (
              <li className="inline-flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <span className="break-words">{address}</span>
              </li>
            ) : null}
            {mapsUrl ? (
              <li>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold-300 transition-colors hover:text-gold-200"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  {t(locale, "contactMapsLabel")}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t(locale, "footerHours")}
          </h2>
          {settings ? (
            <p className="inline-flex items-center gap-2 text-sm text-white/70">
              <Clock className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              {t(locale, "everyDay")} :{" "}
              {formatTimeRange(settings.openingTime, settings.closingTime)}
            </p>
          ) : null}
          {live !== null ? (
            <p
              className={cn(
                "text-sm font-semibold",
                live ? "text-emerald-400" : "text-red-400",
              )}
            >
              {live ? t(locale, "storeOpen") : t(locale, "storeClosed")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-white/50 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {year} {name}
          </p>
          <p>{t(locale, "footerRights")}</p>
        </div>
      </div>
    </footer>
  );
}