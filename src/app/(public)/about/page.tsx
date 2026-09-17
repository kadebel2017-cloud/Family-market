import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { ComingSoon } from "@/components/public/coming-soon";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  return {
    title: t(locale, "pageAboutTitle"),
    description: t(locale, "pageAboutDescription"),
    alternates: { canonical: "/about" },
    openGraph: {
      title: t(locale, "pageAboutTitle"),
      description: t(locale, "pageAboutDescription"),
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  return <ComingSoon locale={locale} />;
}