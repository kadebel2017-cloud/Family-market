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
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="max-w-4xl">
        <span
          aria-hidden
          className="block h-1 w-16 rounded-full bg-gold-500"
        />
        <h1
          dir="auto"
          className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
        >
          {title || t(locale, "pageAboutTitle")}
        </h1>
        {description ? (
          <p
            dir="auto"
            className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-muted-foreground sm:text-lg"
          >
            {description}
          </p>
        ) : null}
      </header>
    </div>
  );
}
