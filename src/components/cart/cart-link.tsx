"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { t } from "@/lib/i18n/translations";
import type { Locale } from "@/types";
import { useCart } from "./cart-context";

export function CartLink({ locale }: { locale: Locale }) {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={t(locale, "navCart")}
      title={t(locale, "navCart")}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-black/10 bg-white text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
    >
      <ShoppingCart className="h-4 w-4" aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute -end-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[11px] font-bold text-white"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
