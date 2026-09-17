import "server-only";

import { db } from "@/lib/db";
import type { MediaAssetSummary, MediaCategory } from "@/lib/media/types";

// Keeps admin pages renderable even if the database is unreachable:
// query failures return a fallback instead of crashing the page.
export async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[admin] base de données injoignable", error);
    return fallback;
  }
}

export async function countAll(): Promise<{
  products: number;
  categories: number;
  promotions: number;
  activePromotions: number;
  unavailableProducts: number;
  media: number;
}> {
  const now = new Date();
  const [products, categories, promotions, activePromotions, unavailableProducts, media] =
    await Promise.all([
      safeQuery(() => db.product.count(), 0),
      safeQuery(() => db.category.count(), 0),
      safeQuery(() => db.promotion.count(), 0),
      safeQuery(
        () =>
          db.promotion.count({
            where: {
              isActive: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
          }),
        0,
      ),
      safeQuery(
        () => db.product.count({ where: { isAvailable: false } }),
        0,
      ),
      safeQuery(() => db.mediaAsset.count(), 0),
    ]);
  return {
    products,
    categories,
    promotions,
    activePromotions,
    unavailableProducts,
    media,
  };
}

export function toMediaSummary(
  asset: {
    id: string;
    name: string;
    url: string;
    type: "image" | "video";
    mimeType: string | null;
    size: number | null;
    category: MediaCategory;
    altFr: string | null;
    altAr: string | null;
    createdAt: Date;
  },
): MediaAssetSummary {
  return {
    id: asset.id,
    name: asset.name,
    url: asset.url,
    type: asset.type,
    mimeType: asset.mimeType,
    size: asset.size,
    category: asset.category,
    altFr: asset.altFr,
    altAr: asset.altAr,
    createdAt: asset.createdAt.toISOString(),
  };
}

export async function listMediaSummaries(limit = 300): Promise<MediaAssetSummary[]> {
  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return assets.map(toMediaSummary);
}