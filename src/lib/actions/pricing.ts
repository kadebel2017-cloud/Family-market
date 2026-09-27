"use server";

import "server-only";

import { db } from "@/lib/db";
import { getEffectivePriceMap } from "@/lib/pricing";

export interface RefreshProductPrice {
  productId: string;
  unit: number;
  available: boolean;
}

export interface RefreshPackPrice {
  packId: string;
  valid: boolean;
  packPrice: number;
  normalTotal: number;
}

export interface RefreshCartResult {
  products: RefreshProductPrice[];
  packs: RefreshPackPrice[];
}

// Re-checks live prices for cart contents (products + packs) so the
// cart and checkout always display current prices: a started promo
// lowers the price, an ended/removed promo reverts it. Read-only.
export async function refreshCartPrices(
  productIds: string[],
  packIds: string[],
): Promise<RefreshCartResult> {
  const cleanProducts = [...new Set(productIds.filter((id) => id !== ""))].slice(0, 50);
  const cleanPacks = [...new Set(packIds.filter((id) => id !== ""))].slice(0, 20);

  const priceMap = await getEffectivePriceMap(cleanProducts);
  const products: RefreshProductPrice[] = cleanProducts.map((id) => {
    const effective = priceMap.get(id);
    return {
      productId: id,
      unit: effective ? effective.unit : 0,
      available: effective ? effective.isAvailable : false,
    };
  });

  let packs: RefreshPackPrice[] = [];
  if (cleanPacks.length > 0) {
    const now = new Date();
    const promotions = await db.promotion.findMany({
      where: { id: { in: cleanPacks } },
      include: { products: { include: { product: true } } },
    });
    packs = cleanPacks.map((id) => {
      const promotion = promotions.find((promo) => promo.id === id);
      const live =
        !!promotion &&
        promotion.type === "PACK" &&
        promotion.isActive &&
        promotion.packPrice !== null &&
        now >= promotion.startDate &&
        now <= promotion.endDate &&
        promotion.products.length > 0 &&
        promotion.products.every((link) => link.product.isAvailable);
      if (!live || !promotion || promotion.packPrice === null) {
        return { packId: id, valid: false, packPrice: 0, normalTotal: 0 };
      }
      const normalTotal = promotion.products.reduce(
        (total, link) => total + Number(link.product.price) * link.quantity,
        0,
      );
      return {
        packId: id,
        valid: true,
        packPrice: Number(promotion.packPrice),
        normalTotal,
      };
    });
  }

  return { products, packs };
}
