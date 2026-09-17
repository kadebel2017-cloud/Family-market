import Link from "next/link";

import { t } from "@/lib/i18n/translations";
import type { Locale } from "@/types";

export function ComingSoon({
  locale,
  title,
  description,
}: {
  locale: Locale;
  title?: string;
  description?: string;
}) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {title ?? t(locale, "comingSoonTitle")}
      </h1>
      <p className="text-base text-muted-foreground">
        {description ?? t(locale, "comingSoonBody")}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-gold-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
      >
        {t(locale, "backToHome")}
      </Link>
    </section>
  );
}