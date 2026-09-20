import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ChevronLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getLocale } from "@/lib/i18n/locale";
import { t, pickLocalized } from "@/lib/i18n/translations";
import { formatPrice, formatPublicDate } from "@/lib/public/format";
import { getPromotionById } from "@/lib/public/queries";
import { ProductGridCard } from "@/components/public/catalog/product-card";
import { ImageFallback } from "@/components/public/image-fallback";
import { PromotionMediaSlider } from "@/components/public/promotions/promotion-media-slider";

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
  const ogImage = promotion.slides[0]?.url ?? promotion.image ?? null;
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
      images: ogImage ? [{ url: ogImage, alt: title }] : undefined,
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
  const isPack = promotion.type === "PACK";

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
        {promotion.slides.length > 0 ? (
          <PromotionMediaSlider slides={promotion.slides} locale={locale} title={title} />
        ) : promotion.image ? (
          <div className="overflow-hidden bg-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={promotion.image} alt={title} draggable={false} className="block h-auto w-full" />
          </div>
        ) : (
          <div className="overflow-hidden bg-black/5">
            <ImageFallback kind="promotion" iconClassName="h-14 w-14" />
          </div>
        )}
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

      {isPack ? (
        <section
          aria-labelledby="pack-contents-title"
          className="mt-8"
        >
          <h2
            id="pack-contents-title"
            className="text-base font-bold text-foreground sm:text-lg"
          >
            {t(locale, "packContentsLabel")}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
            {promotion.packLines.map((line) => {
              const lineName = pickLocalized(locale, line.nameFr, line.nameAr);
              return (
                <Link
                  key={line.productId}
                  href={`/products/${line.slug}`}
                  className="group flex flex-col overflow-hidden rounded-md border border-black/10 bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <span className="relative flex h-[92px] items-center justify-center overflow-hidden bg-white p-2 sm:h-[108px]">
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.image}
                        alt={lineName}
                        draggable={false}
                        className="h-full w-full object-contain object-center"
                      />
                    ) : (
                      <ImageFallback kind="product" />
                    )}
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-black/75 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      ×{line.quantity}
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5 px-2 pb-2 pt-1.5 sm:px-2.5">
                    <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground group-hover:text-gold-700">
                      {lineName}
                    </span>
                    <span className="text-xs font-bold leading-none text-foreground">
                      {formatPrice(locale, line.unitPrice)}
                    </span>
                    <span className="text-[11px] leading-none text-muted-foreground">
                      Quantité ×{line.quantity}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          {promotion.normalTotal !== null && promotion.packPrice !== null ? (
            <dl className="mt-6 flex flex-col gap-1.5 rounded-lg border border-black/10 bg-gold-50/60 px-5 py-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-muted-foreground">{t(locale, "normalTotalLabel")}</dt>
                <dd className="font-medium text-foreground line-through">
                  {formatPrice(locale, promotion.normalTotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm font-semibold text-foreground">
                  {t(locale, "packPriceLabel")}
                </dt>
                <dd className="text-xl font-bold text-gold-600">
                  {formatPrice(locale, promotion.packPrice)}
                </dd>
              </div>
              {promotion.showSavings && promotion.packSavings !== null ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="font-medium text-emerald-700">{t(locale, "savingsLabel")}</dt>
                  <dd className="font-bold text-emerald-700">
                    {formatPrice(locale, promotion.packSavings)}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </section>
      ) : null}

      {!isPack && promotion.products.length > 0 ? (
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