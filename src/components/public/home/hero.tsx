import Image from "next/image";

import { pickLocalized } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { HeroMedia, PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { storeName } from "../store-logo";

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
      className="relative flex min-h-[352px] items-center justify-center overflow-hidden bg-ink sm:min-h-[440px]"
      aria-label={name}
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

      <div className="absolute inset-0 bg-black/10" aria-hidden />
    </section>
  );
}