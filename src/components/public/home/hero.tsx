import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { t, pickLocalized } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { HeroMedia, PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { storeName } from "../store-logo";
import { StoreHours } from "../store-hours";

export function Hero({
  settings,
  heroVideo,
  heroImage,
  locale,
}: {
  settings: PublicSettings | null;
  heroVideo: HeroMedia | null;
  heroImage: HeroMedia | null;
  locale: Locale;
}) {
  const name = storeName(settings, locale);

  return (
    <section
      className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-ink sm:min-h-[400px]"
      aria-labelledby="hero-title"
    >
      {heroImage ? (
        <Image
          src={heroImage.url}
          alt={pickLocalized(locale, heroImage.altFr, heroImage.altAr) || name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}

      {heroVideo ? (
        <video
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            heroImage && "motion-reduce:hidden",
          )}
          src={heroVideo.url}
          poster={heroImage?.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={
            pickLocalized(locale, heroVideo.altFr, heroVideo.altAr) || name
          }
        />
      ) : null}

      <div className="absolute inset-0 bg-black/60" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-10 text-center sm:py-14">
        <h1
          id="hero-title"
          className="break-words text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
        >
          {name}
        </h1>
        <span aria-hidden className="h-1 w-14 rounded-full bg-gold-500" />
        <p className="max-w-xl text-base font-semibold text-white/95 sm:text-lg">
          {t(locale, "heroTagline")}
        </p>
        <p className="max-w-xl text-sm text-white/70">
          {t(locale, "heroLead")}
        </p>

        <StoreHours settings={settings} locale={locale} />

        <form action="/products" role="search" className="mt-1 w-full max-w-xl">
          <div className="flex items-stretch gap-2 rounded-lg bg-white p-1.5 shadow-md">
            <label htmlFor="site-search" className="sr-only">
              {t(locale, "searchPlaceholder")}
            </label>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder={t(locale, "searchPlaceholder")}
              className="h-10 w-full rounded-md border-0 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            <button
              type="submit"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-gold-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span>{t(locale, "searchButton")}</span>
            </button>
          </div>
        </form>

        <div className="mt-0.5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gold-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          >
            {t(locale, "heroCtaProducts")}
          </Link>
          <Link
            href="/promotions"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
          >
            {t(locale, "heroCtaPromotions")}
          </Link>
        </div>
      </div>
    </section>
  );
}