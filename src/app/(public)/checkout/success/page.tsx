import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import { formatPrice, formatPublicDate } from "@/lib/public/format";
import { getOrderByNumber } from "@/lib/orders";
import { DELIVERY_TYPE_LABELS, ORDER_STATUS_LABELS } from "@/lib/order-constants";

type SuccessParams = {
  searchParams: Promise<{ order?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: t(locale, "successTitle") };
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessParams) {
  const [{ order: orderNumber }, locale] = await Promise.all([searchParams, getLocale()]);

  if (!orderNumber) {
    notFound();
  }
  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    notFound();
  }

  return (
    <div
      dir={locale === "ar" ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {t(locale, "successTitle")}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tf(locale, "successBody", order.orderNumber)}
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-black/10 bg-surface p-5 shadow-sm">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t(locale, "checkoutDelivery")}</dt>
            <dd className="font-medium text-foreground">
              {DELIVERY_TYPE_LABELS[order.deliveryType]} — {order.commune},{" "}
              {order.wilayaCode} {order.wilayaName}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t(locale, "cartSubtotal")}</dt>
            <dd className="font-medium text-foreground">{formatPrice(locale, order.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t(locale, "checkoutDelivery")}</dt>
            <dd className="font-medium text-foreground">
              {formatPrice(locale, order.deliveryFee)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t border-black/10 pt-2 text-base">
            <dt className="font-bold text-foreground">{t(locale, "checkoutTotal")}</dt>
            <dd className="font-bold text-foreground">{formatPrice(locale, order.total)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{ORDER_STATUS_LABELS[order.status]}</dt>
            <dd className="text-muted-foreground">{formatPublicDate(locale, order.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-3 border-t border-black/10 pt-4 text-sm">
          {(() => {
            const packGroups = new Map<
              string,
              { title: string; lines: typeof order.items }
            >();
            const loose: typeof order.items = [];
            for (const item of order.items) {
              if (item.promotionId) {
                const existing = packGroups.get(item.promotionId);
                const title = pickLocalized(
                  locale,
                  item.promotionTitleFr,
                  item.promotionTitleAr,
                );
                if (existing) {
                  existing.lines.push(item);
                } else {
                  packGroups.set(item.promotionId, { title, lines: [item] });
                }
              } else {
                loose.push(item);
              }
            }
            return (
              <>
                {[...packGroups.values()].map((group) => (
                  <div key={group.lines[0].promotionId}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gold-600">
                      {t(locale, "packLabel")} — {group.title}
                    </p>
                    <ul className="mt-1 space-y-1.5">
                      {group.lines.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate text-foreground">
                            {pickLocalized(locale, item.productNameFr, item.productNameAr)} ×{" "}
                            {item.quantity}
                          </span>
                          <span className="shrink-0 font-medium text-foreground">
                            {formatPrice(locale, item.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <ul className="space-y-1.5">
                  {loose.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-foreground">
                        {pickLocalized(locale, item.productNameFr, item.productNameAr)} ×{" "}
                        {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium text-foreground">
                        {formatPrice(locale, item.lineTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            );
          })()}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md bg-gold-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
        >
          {t(locale, "successBackHome")}
        </Link>
      </div>
    </div>
  );
}
