import type { Metadata } from "next";
import { ShoppingBasket } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/translations";
import { getActivePromotions } from "@/lib/public/queries";
import { PromotionCard } from "@/components/public/promotions/promotion-card";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "titlePromotions");
  const description = t(locale, "promotionsSubtitle");
  return {
    title,
    description,
    alternates: { canonical: "/promotions" },
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
    },
  };
}

export default async function PromotionsPage() {
  const locale = await getLocale();
  const promotions = await getActivePromotions();
  // Server-rendered per request: the badge status must reflect "now" at
  // request time, not build time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {t(locale, "titlePromotions")}
        </h1>
        <p className="text-muted-foreground">
          {t(locale, "promotionsSubtitle")}
        </p>
      </header>

      {promotions.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-black/15 bg-muted/40 px-6 py-16 text-center">
          <ShoppingBasket className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-base font-medium text-foreground">
            {t(locale, "promotionsEmpty")}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {promotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              locale={locale}
              now={now}
              href={`/promotions/${promotion.id}`}
              titleLevel="h2"
            />
          ))}
        </div>
      )}
    </div>
  );
}