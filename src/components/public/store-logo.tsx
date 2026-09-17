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
}: {
  settings: PublicSettings | null;
  locale: Locale;
  dark?: boolean;
}) {
  const name = storeName(settings, locale);

  if (settings?.logoImage) {
    return (
      <span className="flex min-w-0 items-center gap-2.5">
        <Image
          src={settings.logoImage}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 shrink-0 rounded-lg object-contain"
        />
        <span
          className={cn(
            "truncate text-base font-bold",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {name}
        </span>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold shadow-sm ring-1 ring-black/5",
          dark ? "bg-gold-400 text-black" : "bg-gold-500 text-white",
        )}
      >
        FM
      </span>
      <span
        className={cn(
          "truncate text-base font-bold",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {name}
      </span>
    </span>
  );
}