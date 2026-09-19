import Link from "next/link";
import { CalendarClock, Package } from "lucide-react";

import { t, pickLocalized } from "@/lib/i18n/translations";
import { formatPublicDate, formatPrice } from "@/lib/public/format";
import { cn } from "@/lib/utils";
import type { PromotionCard as PromotionCardData } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { ImageFallback } from "../image-fallback";

export type PromotionStatus = "active" | "scheduled" | "expired";

export function promotionStatus(
  now: number,
  startDate: string,
  endDate: string,
): PromotionStatus {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "active";
  }
  if (now < start) {
    return "scheduled";
  }
  if (now > end) {
    return "expired";
  }
  return "active";
}

const STATUS_STYLE: Record<PromotionStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-gold-100 text-gold-800",
  expired: "bg-red-100 text-red-800",
};

const STATUS_DOT: Record<PromotionStatus, string> = {
  active: "🟢",
  scheduled: "🟡",
  expired: "🔴",
};

const STATUS_LABEL_KEY = {
  active: "promoBadgeActive",
  scheduled: "promoBadgeScheduled",
  expired: "promoBadgeExpired",
} as const;

export function PromotionCard({
  promotion,
  locale,
  now,
  href,
  titleLevel = "h3",
}: {
  promotion: PromotionCardData;
  locale: Locale;
  now: number;
  href: string;
  titleLevel?: "h2" | "h3";
}) {
  const title = pickLocalized(locale, promotion.titleFr, promotion.titleAr);
  const description = pickLocalized(
    locale,
    promotion.descriptionFr,
    promotion.descriptionAr,
  );
  const status = promotionStatus(now, promotion.startDate, promotion.endDate);
  const Title = titleLevel;
  const isPack = promotion.type === "PACK";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
    >
      <div className="overflow-hidden bg-black/5">
        {promotion.image ? (
          // The full uploaded image must keep its natural ratio
          // (width 100%, auto height); next/image requires fixed
          // dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={promotion.image}
            alt={title}
            loading="lazy"
            draggable={false}
            className="block h-auto w-full"
          />
        ) : (
          <ImageFallback kind="promotion" />
        )}
      </div>
      <span className="block h-1 w-full bg-gold-500" aria-hidden />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <Title className="line-clamp-2 text-lg font-semibold text-foreground">
          {title}
        </Title>
        {description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              STATUS_STYLE[status],
            )}
          >
            <span aria-hidden>{STATUS_DOT[status]}</span>
            {t(locale, STATUS_LABEL_KEY[status])}
          </span>
          {isPack && promotion.packPrice !== null ? (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                <Package className="h-3.5 w-3.5" aria-hidden />
                {t(locale, "packLabel")}
              </span>
              <span className="text-lg font-bold text-gold-600">
                {formatPrice(locale, promotion.packPrice)}
              </span>
            </p>
          ) : null}
          <p className="inline-flex items-start gap-1.5 text-sm font-medium text-foreground">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            <span>
              {t(locale, "promotionStarts")}{" "}
              {formatPublicDate(locale, promotion.startDate)}{" "}
              {t(locale, "promotionEnds")}{" "}
              {formatPublicDate(locale, promotion.endDate)}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
