import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { t, pickLocalized } from "@/lib/i18n/translations";
import { safeExternalUrl, safeTelHref, whatsAppHref } from "@/lib/public/site";
import type { PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { SectionHeader } from "./section-header";

const SOCIAL_LABELS: {
  key: "facebookUrl" | "instagramUrl" | "tiktokUrl";
  label: string;
}[] = [
  { key: "facebookUrl", label: "Facebook" },
  { key: "instagramUrl", label: "Instagram" },
  { key: "tiktokUrl", label: "TikTok" },
];

export function ContactSection({
  settings,
  locale,
}: {
  settings: PublicSettings | null;
  locale: Locale;
}) {
  const phone = safeTelHref(settings?.phone);
  const whatsapp = whatsAppHref(settings?.whatsapp);
  const address = pickLocalized(
    locale,
    settings?.addressFr,
    settings?.addressAr,
  );
  const mapsUrl = safeExternalUrl(settings?.googleMapsUrl);
  const socials = SOCIAL_LABELS.map((item) => ({
    ...item,
    url: safeExternalUrl(settings?.[item.key]),
  })).filter((item) => item.url !== null);

  const hasContent = Boolean(phone || whatsapp || address || mapsUrl || socials.length > 0);
  if (!hasContent) {
    return null;
  }

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="contact-title"
    >
      <SectionHeader
        id="contact-title"
        title={t(locale, "sectionContact")}
      />

      <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {phone ? (
          <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
              <Phone className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(locale, "contactPhoneLabel")}
              </p>
              <a
                href={phone}
                className="mt-0.5 text-sm font-semibold text-foreground hover:text-gold-600"
              >
                {settings?.phone}
              </a>
            </div>
          </div>
        ) : null}

        {whatsapp ? (
          <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(locale, "contactWhatsappLabel")}
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 text-sm font-semibold text-foreground hover:text-gold-600"
              >
                {settings?.whatsapp}
              </a>
            </div>
          </div>
        ) : null}

        {address ? (
          <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t(locale, "contactAddressLabel")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {address}
              </p>
            </div>
          </div>
        ) : null}

        {mapsUrl ? (
          <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4 sm:col-span-2 lg:col-span-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t(locale, "contactMapsLabel")}
            </a>
          </div>
        ) : null}

        {socials.length > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-surface p-4 sm:col-span-2 lg:col-span-3">
            <ul className="flex flex-wrap gap-2">
              {socials.map(({ key, label, url }) => (
                <li key={key}>
                  <a
                    href={url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-gold-500 hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/contact"
          className="inline-flex h-11 items-center justify-center rounded-md bg-gold-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          {t(locale, "contactCta")}
        </Link>
      </div>
    </section>
  );
}