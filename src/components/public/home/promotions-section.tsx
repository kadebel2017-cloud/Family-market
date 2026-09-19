import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";

import { t, pickLocalized } from "@/lib/i18n/translations";
import { formatPublicDate } from "@/lib/public/format";
import type { PromotionCard } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { ImageFallback } from "../image-fallback";
import { SectionHeader } from "./section-header";

export function PromotionsSection({
  promotions,
  locale,
}: {
  promotions: PromotionCard[];
  locale: Locale;
}) {
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
        <div className="mt-7 rounded-lg border border-dashed border-black/15 bg-muted/50 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t(locale, "promotionsEmpty")}
          </p>
        </div>
      ) : (
      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {promotions.map((promotion) => {
          const title = pickLocalized(
            locale,
            promotion.titleFr,
            promotion.titleAr,
          );
          const description = pickLocalized(
            locale,
            promotion.descriptionFr,
            promotion.descriptionAr,
          );
          return (
            <Link
              key={promotion.id}
              href="/promotions"
              className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-black/5">
                {promotion.image ? (
                  <Image
                    src={promotion.image}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ImageFallback kind="promotion" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 font-semibold text-foreground">
                  {title}
                </h3>
                {description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {t(locale, "promotionUntil")}{" "}
                    {formatPublicDate(locale, promotion.endDate)}
                  </p>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-gold-600 rtl:rotate-180"
                    aria-hidden
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      )}
    </section>
  );
}