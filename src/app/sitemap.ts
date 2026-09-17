import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/public/site";
import {
  getSitemapCategories,
  getSitemapProducts,
  getSitemapActivePromotions,
} from "@/lib/public/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, promotions] = await Promise.all([
    getSitemapProducts(),
    getSitemapCategories(),
    getSitemapActivePromotions(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/categories`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/promotions`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const promotionRoutes: MetadataRoute.Sitemap = promotions.map(
    (promotion) => ({
      url: `${SITE_URL}/promotions/${promotion.id}`,
      lastModified: promotion.updatedAt,
      changeFrequency: "daily",
      priority: 0.6,
    }),
  );

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...promotionRoutes,
  ];
}