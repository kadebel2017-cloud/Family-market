import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/locale";
import { t, pickLocalized } from "@/lib/i18n/translations";
import { getAboutData } from "@/lib/public/queries";
import { ComingSoon } from "@/components/public/coming-soon";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const about = await getAboutData();
  const title =
    pickLocalized(locale, about.titleFr, about.titleAr) ||
    t(locale, "pageAboutTitle");
  const description =
    pickLocalized(locale, about.descriptionFr, about.descriptionAr) ||
    t(locale, "pageAboutDescription");

  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const about = await getAboutData();

  const title = pickLocalized(locale, about.titleFr, about.titleAr);
  const description = pickLocalized(
    locale,
    about.descriptionFr,
    about.descriptionAr,
  );
  const hasContent = title !== "" || description !== "";

  // No invented business information: when nothing was entered in
  // Admin → Paramètres, keep the page clean.
  if (!hasContent) {
    return <ComingSoon locale={locale} />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {title || t(locale, "pageAboutTitle")}
        </h1>
        {description ? (
          <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </header>
    </div>
  );
}
