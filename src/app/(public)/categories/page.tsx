import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, Store } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import { getPublicCategoriesWithCounts } from "@/lib/public/queries";
import { ImageFallback } from "@/components/public/image-fallback";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "titleCategories");
  const description = t(locale, "categoriesSubtitle");
  return {
    title,
    description,
    alternates: { canonical: "/categories" },
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
    },
  };
}

export default async function CategoriesPage() {
  const locale = await getLocale();
  const categories = await getPublicCategoriesWithCounts();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {t(locale, "titleCategories")}
        </h1>
        <p className="text-muted-foreground">
          {t(locale, "categoriesSubtitle")}
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-black/15 bg-muted/40 px-6 py-16 text-center">
          <Store className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-base font-medium text-foreground">
            {t(locale, "categoriesEmpty")}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const name = pickLocalized(
              locale,
              category.nameFr,
              category.nameAr,
            );
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
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-black/5">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ImageFallback kind="category" tone="dark" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {name}
                  </h2>
                  {description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                  <p className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-medium text-gold-700">
                    <Package className="h-3.5 w-3.5" aria-hidden />
                    {countLabel}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}