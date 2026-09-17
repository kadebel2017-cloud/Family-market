import type { Locale } from "@/types";

export type PriceLike = string | number | null | undefined;

export function formatPrice(locale: Locale, value: PriceLike): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  if (Number.isNaN(n)) {
    return "—";
  }
  const number = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return locale === "ar" ? `${number} دج` : `${number} DA`;
}

export function formatPublicDate(locale: Locale, date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function toNumber(value: PriceLike): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = typeof value === "string" ? Number.parseFloat(value) : Number(value);
  return Number.isNaN(n) ? null : n;
}

export function hasDiscount(price: PriceLike, salePrice: PriceLike): boolean {
  const base = toNumber(price);
  const sale = toNumber(salePrice);
  return base !== null && sale !== null && sale < base;
}

// Integer percentage discount (e.g. 20). Rounds safely and never exceeds 100.
export function discountPercent(
  price: PriceLike,
  salePrice: PriceLike,
): number | null {
  const base = toNumber(price);
  const sale = toNumber(salePrice);
  if (base === null || sale === null || base <= 0 || sale >= base) {
    return null;
  }
  return Math.min(100, Math.max(0, Math.round(((base - sale) / base) * 100)));
}