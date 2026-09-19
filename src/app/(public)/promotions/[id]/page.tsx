import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getLocale } from "@/lib/i18n/locale";
import { t, pickLocalized } from "@/lib/i18n/translations";
import { formatPublicDate } from "@/lib/public/format";
import { getPromotionById } from "@/lib/public/queries";
import { ProductGridCard } from "@/components/public/catalog/product-card";
import { ImageFallback } from "@/components/public/image-fallback";

type PromotionParams = { params: Promise<{ id: string }> };

const statusBadge: Record<
  "active" | "scheduled" | "expired",
  { key: "promotionActive" | "promotionScheduled" | "promotionExpired"; variant: "gold" | "outline" | "black" }
> = {
  active: { key: "promotionActive", variant: "gold" },
  scheduled: { key: "promotionScheduled", variant: "outline" },
  expired: { key: "promotionExpired", variant: "black" },
};

export async function generateMetadata({
  params,
}: PromotionParams): Promise<Metadata> {
  const { id } = await params;
  const [locale, promotion] = await Promise.all([
    getLocale(),
    getPromotionById(id),
  ]);
  if (!promotion) {
    return { title: t(locale, "titlePromotions") };
  }
  const title = pickLocalized(locale, promotion.titleFr, promotion.titleAr);
  const description =
    pickLocalized(locale, promotion.descriptionFr, promotion.descriptionAr) ||
    `${title} — ${t(locale, "titlePromotions")}`;
  return {
    title,
    description,
    alternates: { canonical: `/promotions/${promotion.id}` },
    robots: promotion.status === "expired" ? "noindex, follow" : undefined,
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
      images: promotion.image
        ? [{ url: promotion.image, alt: title }]
        : undefined,
    },
  };
}

export default async function PromotionDetailPage({
  params,
}: PromotionParams) {
  const { id } = await params;
  const locale = await getLocale();
  const promotion = await getPromotionById(id);

  if (!promotion) {
    notFound();
  }

  const title = pickLocalized(locale, promotion.titleFr, promotion.titleAr);
  const description = pickLocalized(
    locale,
    promotion.descriptionFr,
    promotion.descriptionAr,
  );
  const status = statusBadge[promotion.status];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/promotions"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t(locale, "backToPromotions")}
      </Link>

      <article className="mt-4 overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm">
        <div className="overflow-hidden bg-black/5">
          {promotion.image ? (
            // Full original image, same as the homepage promotion cards:
            // natural ratio, full width, auto height — never cropped.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={promotion.image}
              alt={title}
              draggable={false}
              className="block h-auto w-full"
            />
          ) : (
            <ImageFallback kind="promotion" iconClassName="h-14 w-14" />
          )}
        </div>
        <div className="flex flex-col gap-3 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={status.variant}>{t(locale, status.key)}</Badge>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarClock className="h-4 w-4" aria-hidden />
              <span>
                {t(locale, "promotionStarts")}{" "}
                {formatPublicDate(locale, promotion.startDate)}{" "}
                {t(locale, "promotionEnds")}{" "}
                {formatPublicDate(locale, promotion.endDate)}
              </span>
            </p>
          </div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="whitespace-pre-line break-words text-base leading-relaxed text-foreground/90">
              {description}
            </p>
          ) : null}
        </div>
      </article>

      {promotion.products.length > 0 ? (
        <section
          aria-labelledby="related-products-title"
          className="mt-10"
        >
          <h2
            id="related-products-title"
            className="text-xl font-bold text-foreground"
          >
            {t(locale, "relatedProducts")}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {promotion.products.map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}