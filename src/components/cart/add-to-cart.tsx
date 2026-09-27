"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui";
import { t, pickLocalized } from "@/lib/i18n/translations";
import type { Locale } from "@/types";
import { useCart } from "./cart-context";

export interface AddToCartProduct {
  productId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  size: string;
  price: number;
  image: string | null;
}

export function AddToCart({
  product,
  locale,
}: {
  product: AddToCartProduct;
  locale: Locale;
}) {
  const { addLine } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addLine(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex items-center rounded-md border border-black/15 bg-surface"
        role="group"
        aria-label={t(locale, "qtyLabel")}
      >
        <button
          type="button"
          onClick={() => setQty((value) => Math.max(1, value - 1))}
          disabled={qty <= 1}
          aria-label="−"
          className="inline-flex h-11 w-10 items-center justify-center rounded-s-md text-foreground transition-colors hover:bg-black/5 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <span aria-live="polite" className="w-8 text-center text-sm font-bold">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((value) => Math.min(99, value + 1))}
          disabled={qty >= 99}
          aria-label="+"
          className="inline-flex h-11 w-10 items-center justify-center rounded-e-md text-foreground transition-colors hover:bg-black/5 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <Button
        type="button"
        size="md"
        onClick={handleAdd}
        aria-live="polite"
        title={pickLocalized(locale, product.nameFr, product.nameAr)}
      >
        <ShoppingCart className="h-4 w-4" aria-hidden />
        {added ? t(locale, "addedToCart") : t(locale, "addToCart")}
      </Button>
    </div>
  );
}
