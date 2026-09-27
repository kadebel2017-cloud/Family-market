import "server-only";

import { db } from "@/lib/db";

export interface EffectivePrice {
  productId: string;
  /** Base price (Product.price). */
  base: number;
  /** Price actually charged: lowest of base, salePrice and active promos. */
  unit: number;
  isAvailable: boolean;
  hasPromo: boolean;
}

// Single source of truth for loose-product pricing, used by product
// pages, cards, cart refresh and order placement: base price, product
// salePrice, and every currently-active PRODUCT_DISCOUNT promo compete —
// the lowest price strictly below base wins. A removed, deactivated or
// expired promo simply stops contributing, so prices revert by themselves.
export async function getEffectivePriceMap(
  productIds: string[],
): Promise<Map<string, EffectivePrice>> {
  const result = new Map<string, EffectivePrice>();
  const ids = [...new Set(productIds.filter((id) => typeof id === "string" && id !== ""))];
  if (ids.length === 0) {
    return result;
  }
  const now = new Date();
  const [products, links] = await Promise.all([
    db.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true, salePrice: true, isAvailable: true },
    }),
    db.promotionProduct.findMany({
      where: {
        productId: { in: ids },
        promoPrice: { not: null },
        promotion: {
          isActive: true,
          type: "PRODUCT_DISCOUNT",
          startDate: { lte: now },
          endDate: { gte: now },
        },
      },
      select: { productId: true, promoPrice: true },
    }),
  ]);

  const bestPromo = new Map<string, number>();
  for (const link of links) {
    if (link.promoPrice === null) {
      continue;
    }
    const value = Number(link.promoPrice);
    const current = bestPromo.get(link.productId);
    if (current === undefined || value < current) {
      bestPromo.set(link.productId, value);
    }
  }

  for (const product of products) {
    const base = Number(product.price);
    const sale = product.salePrice === null ? null : Number(product.salePrice);
    const promo = bestPromo.get(product.id) ?? null;
    let unit = base;
    if (sale !== null && sale < unit) {
      unit = sale;
    }
    if (promo !== null && promo < unit) {
      unit = promo;
    }
    result.set(product.id, {
      productId: product.id,
      base,
      unit,
      isAvailable: product.isAvailable,
      hasPromo: promo !== null && promo < base,
    });
  }
  return result;
}

// Overrides the display `salePrice` of product cards / details with the
// effective price when a sale or promo beats the base price.
export function applyEffectiveSalePrice<
  T extends { id: string; price: string; salePrice: string | null },
>(cards: T[], prices: Map<string, EffectivePrice>): T[] {
  return cards.map((card) => {
    const effective = prices.get(card.id);
    if (!effective) {
      return card;
    }
    const base = Number(card.price);
    if (!Number.isFinite(base) || effective.unit >= base) {
      return { ...card, salePrice: null };
    }
    return { ...card, salePrice: effective.unit.toFixed(2) };
  });
}
