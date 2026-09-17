"use client";

import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

import {
  LOCALE_COOKIE_NAME,
  t,
} from "@/lib/i18n/translations";
import type { Locale } from "@/types";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const nextLocale: Locale = locale === "fr" ? "ar" : "fr";
  const label = t(
    locale,
    locale === "fr" ? "switchToArabic" : "switchToFrench",
  );

  const handleSwitch = () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      aria-label={label}
      title={label}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-black/10 bg-white px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
    >
      <Globe className="h-4 w-4" aria-hidden />
      <span>{locale === "fr" ? "العربية" : "FR"}</span>
    </button>
  );
}