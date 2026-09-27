"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui";
import { t, pickLocalized } from "@/lib/i18n/translations";
import { formatPrice } from "@/lib/public/format";
import type { Locale } from "@/types";
import { entryKey, useCart, type CartEntry } from "./cart-context";
import { usePriceRefresh } from "./use-price-refresh";
import { ImageFallback } from "@/components/public/image-fallback";

function QtyStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (qty: number) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-md border border-black/15"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label="−"
        className="inline-flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-black/5"
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span aria-live="polite" className="w-8 text-center text-sm font-bold">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        disabled={value >= 99}
        aria-label="+"
        className="inline-flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-black/5 disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

function ProductRow({
  entry,
  locale,
}: {
  entry: Extract<CartEntry, { kind: "product" }>;
  locale: Locale;
}) {
  const { setQty, removeLine } = useCart();
  const key = entryKey(entry);
  const name = pickLocalized(locale, entry.nameFr, entry.nameAr);
  return (
    <li className="flex gap-4 rounded-lg border border-black/10 bg-surface p-4 shadow-sm">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-black/10 bg-black/5">
        {entry.image ? (
          <Image
            src={entry.image}
            alt={name}
            fill
            sizes="80px"
            className="object-contain object-center"
          />
        ) : (
          <ImageFallback kind="product" iconClassName="h-8 w-8" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            {entry.size ? (
              <p className="text-xs text-muted-foreground">{entry.size}</p>
            ) : null}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatPrice(locale, entry.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeLine(key)}
            aria-label={t(locale, "cartRemove")}
            title={t(locale, "cartRemove")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <QtyStepper
            value={entry.qty}
            onChange={(qty) => setQty(key, qty)}
            label={t(locale, "qtyLabel")}
          />
          <p className="text-sm font-bold text-foreground">
            {formatPrice(locale, entry.price * entry.qty)}
          </p>
        </div>
      </div>
    </li>
  );
}

function PackRow({
  entry,
  locale,
}: {
  entry: Extract<CartEntry, { kind: "pack" }>;
  locale: Locale;
}) {
  const { setQty, removeLine } = useCart();
  const key = entryKey(entry);
  const title = pickLocalized(locale, entry.titleFr, entry.titleAr);
  return (
    <li className="rounded-lg border-2 border-gold-500/60 bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gold-600">
            {t(locale, "packLabel")}
          </p>
          <p className="truncate text-sm font-bold text-foreground">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => removeLine(key)}
          aria-label={t(locale, "cartRemove")}
          title={t(locale, "cartRemove")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {t(locale, "packContentsLabel")}
      </p>
      <ul className="mt-1.5 flex flex-col gap-1.5">
        {entry.items.map((item) => {
          const name = pickLocalized(locale, item.nameFr, item.nameAr);
          return (
            <li key={item.productId} className="flex items-center gap-2.5">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-black/10 bg-black/5">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={name}
                    fill
                    sizes="40px"
                    className="object-contain object-center"
                  />
                ) : (
                  <ImageFallback kind="product" iconClassName="h-4 w-4" />
                )}
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-foreground">
                {name} <span className="text-muted-foreground">× {item.qty}</span>
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/10 pt-3">
        <QtyStepper
          value={entry.qty}
          onChange={(qty) => setQty(key, qty)}
          label={t(locale, "qtyLabel")}
        />
        <div className="text-end">
          <p className="text-xs text-muted-foreground line-through">
            {formatPrice(locale, entry.normalTotal * entry.qty)}
          </p>
          <p className="text-sm font-bold text-gold-600">
            {formatPrice(locale, entry.packPrice * entry.qty)}
          </p>
        </div>
      </div>
    </li>
  );
}

export function CartView({ locale }: { locale: Locale }) {
  const { lines, subtotal, normalTotal } = useCart();
  const { changed } = usePriceRefresh();
  const hasPack = lines.some((line) => line.kind === "pack");

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 py-16 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50" aria-hidden />
        <div>
          <p className="text-lg font-semibold text-foreground">{t(locale, "cartEmpty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t(locale, "cartEmptyHint")}</p>
        </div>
        <Button href="/products" variant="outline">
          {t(locale, "cartContinue")}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {changed ? (
        <p
          role="status"
          className="rounded-lg border border-gold-300 bg-gold-50 px-4 py-2.5 text-sm text-foreground lg:col-span-3"
        >
          {t(locale, "pricesUpdatedNote")}
        </p>
      ) : null}
      <ul className="flex flex-col gap-4 lg:col-span-2">
        {lines.map((line) =>
          line.kind === "pack" ? (
            <PackRow key={entryKey(line)} entry={line} locale={locale} />
          ) : (
            <ProductRow key={entryKey(line)} entry={line} locale={locale} />
          ),
        )}
      </ul>

      <aside className="h-fit rounded-lg border border-black/10 bg-surface p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="text-base font-bold text-foreground">{t(locale, "cartSummary")}</h2>
        {hasPack ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t(locale, "normalTotalLabel")}</span>
            <span className="font-medium text-muted-foreground line-through">
              {formatPrice(locale, normalTotal)}
            </span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {hasPack ? t(locale, "packPriceLabel") : t(locale, "cartSubtotal")}
          </span>
          <span className="font-bold text-foreground">{formatPrice(locale, subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t(locale, "cartDeliveryHint")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button href="/checkout" size="lg" className="w-full">
            {t(locale, "cartCheckout")}
          </Button>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-black/15 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-black/5"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            {t(locale, "cartContinue")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
