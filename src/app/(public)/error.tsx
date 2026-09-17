"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { LOCALE_COOKIE_NAME, t } from "@/lib/i18n/translations";
import type { Locale } from "@/types";

export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [locale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "fr";
    }
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_NAME}=(\\w+)`),
    );
    return match?.[1] === "ar" ? "ar" : "fr";
  });

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="h-12 w-12 text-gold-600" aria-hidden />
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {t(locale, "errorTitle")}
      </h1>
      <p className="text-base text-muted-foreground">
        {t(locale, "errorBody")}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center justify-center rounded-md bg-gold-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          {t(locale, "errorRetry")}
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/15 bg-surface px-6 text-sm font-semibold text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
        >
          {t(locale, "backToHome")}
        </Link>
      </div>
    </section>
  );
}
