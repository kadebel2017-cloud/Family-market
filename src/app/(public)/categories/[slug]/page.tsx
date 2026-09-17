import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, LayoutGrid, Store } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import {
  getCategoryBySlug,
  getProductsPage,
} from "@/lib/public/queries";
import { ProductGridCard } from "@/components/public/catalog/product-card";
import { Pagination } from "@/components/public/catalog/pagination";
import { ImageFallback } from "@/components/public/image-fallback";

type CategoryParams = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [locale, category] = await Promise.all([
    getLocale(),
    getCategoryBySlug(slug),
  ]);
  if (!category) {
    return { title: t(locale, "titleCategories") };
  }
  const name = pickLocalized(locale, category.nameFr, category.nameAr);
  const description =
    pickLocalized(locale, category.descriptionFr, category.descriptionAr) ||
    `${name} — ${t(locale, "titleCategories")}`;
  return {
    title: name,
    description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title: name,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
      images: category.image
        ? [{ url: category.image, alt: name }]
        : undefined,
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryParams) {
  const { slug } = await params;
  const locale = await getLocale();
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const search = await searchParams;
  const parsedPage = Number.parseInt(search.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const result = await getProductsPage({
    categorySlug: category.slug,
    page,
    locale,
  });

  const name = pickLocalized(locale, category.nameFr, category.nameAr);
  const description = pickLocalized(
    locale,
    category.descriptionFr,
    category.descriptionAr,
  );
  const countLabel =
    category.productCount === 1
      ? tf(locale, "productsCountOne", category.productCount)
      : tf(locale, "productsCountMany", category.productCount);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/categories"
        className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t(locale, "backToCategories")}
      </Link>

      <header className="mt-4 overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm">
        <div className="relative h-44 bg-black/5 sm:h-60">
          {category.image ? (
            <Image
              src={category.image}
              alt={name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <ImageFallback kind="category" tone="dark" iconClassName="h-12 w-12" />
          )}
          <span
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {name}
            </h1>
            <p className="mt-1 text-sm text-white/85">{countLabel}</p>
          </div>
        </div>
        {description ? (
          <p className="p-5 text-sm leading-relaxed text-muted-foreground sm:p-6">
            {description}
          </p>
        ) : null}
      </header>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/products?category=${category.slug}`}
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-gold-600 transition-colors hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
          {t(locale, "seeAllInCategory")}
        </Link>
      </div>

      {result.items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-black/15 bg-muted/40 px-6 py-16 text-center">
          <Store className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-base font-medium text-foreground">
            {t(locale, "productsEmpty")}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
            {result.items.map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                locale={locale}
              />
            ))}
          </div>
          <div className="mt-8">
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              basePath={`/categories/${category.slug}`}
              locale={locale}
            />
          </div>
        </>
      )}
    </div>
  );
}