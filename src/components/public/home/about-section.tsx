import { t } from "@/lib/i18n/translations";
import type { PublicSettings } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { StoreLogo } from "../store-logo";
import { SectionHeader } from "./section-header";

export function AboutSection({
  settings,
  locale,
}: {
  settings: PublicSettings | null;
  locale: Locale;
}) {
  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="about-title"
    >
      <SectionHeader
        id="about-title"
        title={t(locale, "sectionAbout")}
      />

      <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t(locale, "aboutIntro")}
          </p>
        </div>

        <div className="rounded-lg border-t-4 border-gold-500 bg-black p-8 text-white shadow-lg">
          <StoreLogo settings={settings} locale={locale} dark />
          <p className="mt-4 text-sm text-white/60">
            {t(locale, "heroTagline")}
          </p>
        </div>
      </div>
    </section>
  );
}