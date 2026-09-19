import { t } from "@/lib/i18n/translations";
import type { PromotionCard as PromotionCardData } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { PromotionCard } from "../promotions/promotion-card";
import { SectionHeader } from "./section-header";

export function PromotionsSection({
  promotions,
  locale,
}: {
  promotions: PromotionCardData[];
  locale: Locale;
}) {
  // Server-rendered per request: the badge status must reflect "now" at
  // request time, not build time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  return (
    <section
      id="promotions"
      className="mx-auto w-full max-w-7xl scroll-mt-36 px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="promotions-title"
    >
      <SectionHeader
        id="promotions-title"
        title={t(locale, "sectionPromotions")}
        action={
          promotions.length > 0
            ? { label: t(locale, "viewAllPromotions"), href: "/promotions" }
            : undefined
        }
      />

      {promotions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-black/15 bg-muted/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
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
          />
        ))}
      </div>
      )}
    </section>
  );
}
