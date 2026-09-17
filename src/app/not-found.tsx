import Link from "next/link";
import { Compass } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";

export default async function NotFound() {
  const locale = await getLocale();

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <Compass className="h-12 w-12 text-gold-600" aria-hidden />
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {t(locale, "notFoundTitle")}
      </h1>
      <p className="text-base text-muted-foreground">
        {t(locale, "notFoundBody")}
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