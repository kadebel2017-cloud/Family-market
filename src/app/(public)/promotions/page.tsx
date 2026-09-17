import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock, ShoppingBasket } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t, pickLocalized } from "@/lib/i18n/translations";
import { formatPublicDate } from "@/lib/public/format";
import { getActivePromotions } from "@/lib/public/queries";
import { ImageFallback } from "@/components/public/image-fallback";

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
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                href={`/promotions/${promotion.id}`}
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
                  <h2 className="line-clamp-2 font-semibold text-foreground">
                    {title}
                  </h2>
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
    </div>
  );
}