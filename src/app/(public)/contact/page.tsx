import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t, pickLocalized } from "@/lib/i18n/translations";
import { getSettings } from "@/lib/public/queries";
import { storeName } from "@/components/public/store-logo";
import { formatTimeRange, isOpenNow } from "@/lib/public/schedule";
import {
  safeExternalUrl,
  safeTelHref,
  whatsAppHref,
} from "@/lib/public/site";
import type { PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";

const SOCIAL_ITEMS: {
  key: "facebookUrl" | "instagramUrl" | "tiktokUrl";
  label: string;
}[] = [
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
  { key: "tiktokUrl", label: "TikTok" },
];

function HoursCard({
  settings,
  locale,
}: {
  settings: PublicSettings;
  locale: Locale;
}) {
  const live = settings.isOpenAutomatically
    ? isOpenNow(new Date(), {
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
      })
    : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <Clock className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t(locale, "hoursLabel")}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {t(locale, "everyDay")} :{" "}
          {formatTimeRange(settings.openingTime, settings.closingTime)}
        </p>
        {live !== null ? (
          <p
            className={
              live
                ? "mt-1 text-sm font-semibold text-emerald-700"
                : "mt-1 text-sm font-semibold text-red-700"
            }
          >
            {live ? t(locale, "storeOpen") : t(locale, "storeClosed")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const name = storeName(null, locale);

  return {
    title: t(locale, "contactTitle"),
    description: t(locale, "contactPageDescription"),
    alternates: { canonical: "/contact" },
    openGraph: {
      title: `${t(locale, "contactTitle")} | ${name}`,
      description: t(locale, "contactPageDescription"),
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const settings = await getSettings();

  const phone = safeTelHref(settings?.phone);
  const whatsappHrefValue = whatsAppHref(settings?.whatsapp);
  const address = pickLocalized(
    locale,
    settings?.addressFr,
    settings?.addressAr,
  );
  const mapsUrl = safeExternalUrl(settings?.googleMapsUrl);
  const socials = SOCIAL_ITEMS.map((item) => ({
    ...item,
    url: safeExternalUrl(settings?.[item.key]),
  })).filter((item) => item.url !== null);

  const hasContent = Boolean(
    phone || whatsappHrefValue || address || mapsUrl || socials.length > 0,
  );

  return (
    <section
      className="mx-auto w-full max-w-7xl flex-1 px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="contact-page-title"
    >
      <header className="max-w-2xl">
        <h1
          id="contact-page-title"
          className="text-2xl font-bold text-foreground"
        >
          {t(locale, "contactTitle")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t(locale, "contactPageDescription")}
        </p>
      </header>

      {hasContent ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {phone ? (
            <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                  <Phone className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(locale, "contactPhoneLabel")}
                  </p>
                  <a
                    href={phone}
                    className="mt-0.5 block text-sm font-semibold text-foreground hover:text-gold-600"
                  >
                    {settings?.phone}
                  </a>
                </div>
              </div>
              <Link
                href={phone}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gold-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {t(locale, "contactCallLabel")}
              </Link>
            </div>
          ) : null}

          {whatsappHrefValue ? (
            <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-surface p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <MessageCircle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t(locale, "contactWhatsappLabel")}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {settings?.whatsapp}
                  </p>
                </div>
              </div>
              <a
                href={whatsappHrefValue}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t(locale, "contactWhatsappAction")}
              </a>
            </div>
          ) : null}

          {address ? (
            <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t(locale, "contactAddressLabel")}
                </p>
                <p className="mt-0.5 break-words text-sm font-semibold text-foreground">
                  {address}
                </p>
              </div>
            </div>
          ) : null}

          {settings ? <HoursCard settings={settings} locale={locale} /> : null}

          {mapsUrl ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-surface p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <p className="break-words text-sm font-semibold text-foreground">
                  {address}
                </p>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {t(locale, "contactMapsLabel")}
              </a>
            </div>
          ) : null}

          {socials.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-black/10 bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(locale, "contactSocialLabel")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {socials.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-gold-500 hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 text-base text-muted-foreground">
          {t(locale, "contactNoInfo")}
        </p>
      )}
    </section>
  );
}