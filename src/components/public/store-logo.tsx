import Image from "next/image";

import { cn } from "@/lib/utils";
import { pickLocalized } from "@/lib/i18n/translations";
import type { PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";

export function storeName(settings: PublicSettings | null, locale: Locale): string {
  return (
    pickLocalized(locale, settings?.storeNameFr, settings?.storeNameAr) ||
    "Family Market"
  );
}

export function StoreLogo({
  settings,
  locale,
  dark = false,
  size = "md",
}: {
  settings: PublicSettings | null;
  locale: Locale;
  dark?: boolean;
  size?: "md" | "lg";
}) {
  const name = storeName(settings, locale);
  const large = size === "lg";

  if (settings?.logoImage) {
    return (
      <span className={cn("flex min-w-0 items-center", large ? "gap-3" : "gap-2.5")}>
        <Image
          src={settings.logoImage}
          alt=""
          width={large ? 60 : 40}
          height={large ? 60 : 40}
          unoptimized
          className={cn(
            "shrink-0 rounded-lg object-contain",
            large ? "h-[60px] w-[60px]" : "h-10 w-10",
          )}
        />
        <span
          className={cn(
            "truncate font-bold",
            // Mobile-only smaller text so the full name fits beside the
            // logo; sm and up unchanged.
            large ? "text-base sm:text-[1.35rem]" : "text-base",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {name}
        </span>
      </span>
    );
  }

  return (
    <span className={cn("flex min-w-0 items-center", large ? "gap-3" : "gap-2.5")}>
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg font-extrabold shadow-sm ring-1 ring-black/5",
          large ? "h-[60px] w-[60px] text-xl" : "h-10 w-10 text-sm",
          dark ? "bg-gold-400 text-black" : "bg-gold-500 text-white",
        )}
      >
        FM
      </span>
      <span
        className={cn(
          "truncate font-bold",
          large ? "text-base sm:text-2xl" : "text-base",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {name}
      </span>
    </span>
  );
}