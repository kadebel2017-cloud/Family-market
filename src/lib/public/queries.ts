import "server-only";

import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { Locale } from "@/types";

export interface PublicSettings {
  id: string;
  storeNameFr: string;
  storeNameAr: string;
  phone: string | null;
  whatsapp: string | null;
  addressFr: string | null;
  addressAr: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  googleMapsUrl: string | null;
  logoImage: string | null;
  heroMedia: string | null;
  openingTime: string;
  closingTime: string;
  isOpenAutomatically: boolean;
}

export interface CategoryCard {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  image: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
}

export interface PromotionCard {
  id: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  image: string | null;
  startDate: string;
  endDate: string;
}

export interface ProductCard {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  size: string;
  image: string | null;
  price: string;
  salePrice: string | null;
  categoryFr: string | null;
  categoryAr: string | null;
}

export interface HeroMedia {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  altFr: string | null;
  altAr: string | null;
}

export interface PublicHomeData {
  settings: PublicSettings | null;
  heroVideo: HeroMedia | null;
  heroImage: HeroMedia | null;
  categories: CategoryCard[];
  promotions: PromotionCard[];
  products: ProductCard[];
}

export interface CategoryWithProductCount extends CategoryCard {
  productCount: number;
}

export interface ProductDetail {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  size: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  image: string | null;
  price: string;
  salePrice: string | null;
  category: {
    id: string;
    slug: string;
    nameFr: string;
    nameAr: string;
    image: string | null;
  };
}

export const PRODUCT_SORTS = [
  "relevance",
  "name_asc",
  "price_asc",
  "price_desc",
  "newest",
] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface ProductsPageResult {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type PromotionStatus = "active" | "scheduled" | "expired";

export interface PromotionDetail extends PromotionCard {
  status: PromotionStatus;
  products: ProductCard[];
}

const PUBLIC_PAGE_SIZE = 12;

type DecimalLike = { toFixed(digits?: number): string };

function toCategoryCard(category: {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  image: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
}): CategoryCard {
  return {
    id: category.id,
    nameFr: category.nameFr,
    nameAr: category.nameAr,
    slug: category.slug,
    image: category.image,
    descriptionFr: category.descriptionFr,
    descriptionAr: category.descriptionAr,
  };
}

function toProductCard(product: {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  size: string;
  image: string | null;
  price: DecimalLike;
  salePrice: DecimalLike | null;
  category: { nameFr: string; nameAr: string };
}): ProductCard {
  return {
    id: product.id,
    nameFr: product.nameFr,
    nameAr: product.nameAr,
    slug: product.slug,
    size: product.size,
    image: product.image,
    price: product.price.toFixed(2),
    salePrice: product.salePrice?.toFixed(2) ?? null,
    categoryFr: product.category.nameFr,
    categoryAr: product.category.nameAr,
  };
}

function toPromotionCard(promotion: {
  id: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  image: string | null;
  startDate: Date;
  endDate: Date;
}): PromotionCard {
  return {
    id: promotion.id,
    titleFr: promotion.titleFr,
    titleAr: promotion.titleAr,
    descriptionFr: promotion.descriptionFr,
    descriptionAr: promotion.descriptionAr,
    image: promotion.image,
    startDate: promotion.startDate.toISOString(),
    endDate: promotion.endDate.toISOString(),
  };
}

async function safePublic<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("[public] base de données injoignable", error);
    return fallback;
  }
}

export async function getSettings(): Promise<PublicSettings | null> {
  return safePublic(async () => {
    const settings = await db.storeSettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) {
      return null;
    }
    return {
      id: settings.id,
      storeNameFr: settings.storeNameFr,
      storeNameAr: settings.storeNameAr,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      addressFr: settings.addressFr,
      addressAr: settings.addressAr,
      facebookUrl: settings.facebookUrl,
      instagramUrl: settings.instagramUrl,
      tiktokUrl: settings.tiktokUrl,
      googleMapsUrl: settings.googleMapsUrl,
      logoImage: settings.logoImage,
      heroMedia: settings.heroMedia,
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      isOpenAutomatically: settings.isOpenAutomatically,
    } satisfies PublicSettings;
  }, null);
}

export async function getHomeHero(
  heroMediaUrl?: string | null,
): Promise<{
  heroVideo: HeroMedia | null;
  heroImage: HeroMedia | null;
}> {
  return safePublic(async () => {
    const [assets, explicit] = await Promise.all([
      db.mediaAsset.findMany({
        where: { category: "HERO" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      heroMediaUrl
        ? db.mediaAsset.findFirst({ where: { url: heroMediaUrl } })
        : null,
    ]);
    const heroVideo = (explicit?.type === "video"
      ? explicit
      : assets.find((asset) => asset.type === "video")) ?? null;
    const heroImage = (explicit?.type === "image"
      ? explicit
      : assets.find((asset) => asset.type === "image")) ?? null;
    const toHero = (
      asset: (typeof assets)[number],
    ): HeroMedia => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type,
      altFr: asset.altFr,
      altAr: asset.altAr,
    });
    return {
      heroVideo: heroVideo ? toHero(heroVideo) : null,
      heroImage: heroImage ? toHero(heroImage) : null,
    };
  }, { heroVideo: null, heroImage: null });
}

export async function getHomeData(): Promise<PublicHomeData> {
  const settings = await getSettings();
  const hero = await getHomeHero(settings?.heroMedia ?? null);
  const [categories, promotions, products] = await Promise.all([
    safePublic(
      () =>
        db.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          take: 12,
        }),
      [],
    ),
    safePublic(() => {
      const now = new Date();
      return db.promotion.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { endDate: "asc" },
        take: 4,
      });
    }, []),
    safePublic(
      () =>
        db.product.findMany({
          where: { isAvailable: true },
          include: { category: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      [],
    ),
  ]);

  return {
    settings,
    heroVideo: hero.heroVideo,
    heroImage: hero.heroImage,
    categories: categories.map((category) => ({
      id: category.id,
      nameFr: category.nameFr,
      nameAr: category.nameAr,
      slug: category.slug,
      image: category.image,
      descriptionFr: category.descriptionFr,
      descriptionAr: category.descriptionAr,
    })),
    promotions: promotions.map((promotion) => ({
      id: promotion.id,
      titleFr: promotion.titleFr,
      titleAr: promotion.titleAr,
      descriptionFr: promotion.descriptionFr,
      descriptionAr: promotion.descriptionAr,
      image: promotion.image,
      startDate: promotion.startDate.toISOString(),
      endDate: promotion.endDate.toISOString(),
    })),
    products: products.map((product) => ({
      id: product.id,
      nameFr: product.nameFr,
      nameAr: product.nameAr,
      slug: product.slug,
      size: product.size,
      image: product.image,
      price: product.price.toFixed(2),
      salePrice: product.salePrice?.toFixed(2) ?? null,
      categoryFr: product.category.nameFr,
      categoryAr: product.category.nameAr,
    })),
  };
}

export async function getPublicCategories(): Promise<CategoryCard[]> {
  return safePublic(async () => {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 48,
    });
    return categories.map(toCategoryCard);
  }, []);
}

export async function getPublicCategoriesWithCounts(): Promise<
  CategoryWithProductCount[]
> {
  return safePublic(async () => {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 48,
      include: {
        _count: { select: { products: { where: { isAvailable: true } } } },
      },
    });
    return categories.map((category) => ({
      ...toCategoryCard(category),
      productCount: category._count.products,
    }));
  }, []);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryWithProductCount | null> {
  const cleanSlug = slug?.trim();
  if (!cleanSlug) {
    return null;
  }
  return safePublic(async () => {
    const category = await db.category.findFirst({
      where: { slug: cleanSlug, isActive: true },
    });
    if (!category) {
      return null;
    }
    const productCount = await db.product.count({
      where: { isAvailable: true, categoryId: category.id },
    });
    return { ...toCategoryCard(category), productCount };
  }, null);
}

export async function getProductsPage({
  q,
  categorySlug,
  sort,
  page = 1,
  locale = "fr",
}: {
  q?: string;
  categorySlug?: string;
  sort?: string | null;
  page?: number;
  locale?: Locale;
}): Promise<ProductsPageResult> {
  return safePublic(
    async () => {
      const safeQuery = q?.trim().slice(0, 100) || null;
      const safeCategory = categorySlug?.trim().slice(0, 120) || null;
      const currentPage =
        Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
      const chosenSort: ProductSort = (
        PRODUCT_SORTS as readonly string[]
      ).includes(sort ?? "")
        ? (sort as ProductSort)
        : "relevance";

      const where: Prisma.ProductWhereInput = { isAvailable: true };
      if (safeQuery) {
        where.OR = [
          { nameFr: { contains: safeQuery, mode: "insensitive" } },
          { nameAr: { contains: safeQuery, mode: "insensitive" } },
        ];
      }
      if (safeCategory) {
        where.category = { slug: safeCategory, isActive: true };
      }

      let orderBy: Prisma.ProductOrderByWithRelationInput;
      switch (chosenSort) {
        case "name_asc":
          orderBy = locale === "ar" ? { nameAr: "asc" } : { nameFr: "asc" };
          break;
        case "price_asc":
          orderBy = { price: "asc" };
          break;
        case "price_desc":
          orderBy = { price: "desc" };
          break;
        default:
          orderBy = { createdAt: "desc" };
          break;
      }

      const [total, products] = await Promise.all([
        db.product.count({ where }),
        db.product.findMany({
          where,
          include: { category: true },
          orderBy,
          skip: (currentPage - 1) * PUBLIC_PAGE_SIZE,
          take: PUBLIC_PAGE_SIZE,
        }),
      ]);

      return {
        items: products.map(toProductCard),
        total,
        page: currentPage,
        pageSize: PUBLIC_PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PUBLIC_PAGE_SIZE)),
      };
    },
    { items: [], total: 0, page: 1, pageSize: PUBLIC_PAGE_SIZE, totalPages: 1 },
  );
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const cleanSlug = slug?.trim();
  if (!cleanSlug) {
    return null;
  }
  return safePublic(async () => {
    const product = await db.product.findFirst({
      where: { slug: cleanSlug, isAvailable: true },
      include: { category: true },
    });
    if (!product) {
      return null;
    }
    return {
      id: product.id,
      slug: product.slug,
      nameFr: product.nameFr,
      nameAr: product.nameAr,
      descriptionFr: product.descriptionFr,
      descriptionAr: product.descriptionAr,
      size: product.size,
      image: product.image,
      price: product.price.toFixed(2),
      salePrice: product.salePrice?.toFixed(2) ?? null,
      category: {
        id: product.category.id,
        slug: product.category.slug,
        nameFr: product.category.nameFr,
        nameAr: product.category.nameAr,
        image: product.category.image,
      },
    };
  }, null);
}

export async function getActivePromotions(): Promise<PromotionCard[]> {
  return safePublic(async () => {
    const now = new Date();
    const promotions = await db.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: "asc" },
      take: 48,
    });
    return promotions.map(toPromotionCard);
  }, []);
}

export async function getPromotionById(
  id: string,
): Promise<PromotionDetail | null> {
  const cleanId = id?.trim();
  if (!cleanId) {
    return null;
  }
  return safePublic(async () => {
    const promotion = await db.promotion.findUnique({
      where: { id: cleanId },
      include: {
        products: {
          include: { product: { include: { category: true } } },
        },
      },
    });
    if (!promotion) {
      return null;
    }
    const now = new Date();
    const status: PromotionStatus =
      now < promotion.startDate
        ? "scheduled"
        : now > promotion.endDate
          ? "expired"
          : "active";
    const products = promotion.products
      .map((link) => link.product)
      .filter((product) => product.isAvailable)
      .map(toProductCard);
    return { ...toPromotionCard(promotion), status, products };
  }, null);
}

export interface SitemapProduct {
  slug: string;
  updatedAt: string;
}

export interface SitemapCategory {
  slug: string;
  updatedAt: string;
}

export interface SitemapPromotion {
  id: string;
  updatedAt: string;
}

export async function getSitemapProducts(): Promise<SitemapProduct[]> {
  return safePublic(async () => {
    const products = await db.product.findMany({
      where: { isAvailable: true },
      select: { slug: true, updatedAt: true },
    });
    return products.map((product) => ({
      slug: product.slug,
      updatedAt: product.updatedAt.toISOString(),
    }));
  }, []);
}

export async function getSitemapCategories(): Promise<SitemapCategory[]> {
  return safePublic(async () => {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    return categories.map((category) => ({
      slug: category.slug,
      updatedAt: category.updatedAt.toISOString(),
    }));
  }, []);
}

export async function getSitemapActivePromotions(): Promise<SitemapPromotion[]> {
  return safePublic(async () => {
    const now = new Date();
    const promotions = await db.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: { id: true, updatedAt: true },
    });
    return promotions.map((promotion) => ({
      id: promotion.id,
      updatedAt: promotion.updatedAt.toISOString(),
    }));
  }, []);
}