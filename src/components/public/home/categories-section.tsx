import Image from "next/image";
import Link from "next/link";

import { t, pickLocalized } from "@/lib/i18n/translations";
import type { CategoryCard } from "@/lib/public/queries";
import type { Locale } from "@/types";
import { ImageFallback } from "../image-fallback";
import { SectionHeader } from "./section-header";

export function CategoriesSection({
  categories,
  locale,
}: {
  categories: CategoryCard[];
  locale: Locale;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      aria-labelledby="categories-title"
    >
      <SectionHeader
        id="categories-title"
        title={t(locale, "sectionCategories")}
        action={{ label: t(locale, "viewAllCategories"), href: "/categories" }}
      />

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
        {categories.map((category) => {
          const name = pickLocalized(
            locale,
            category.nameFr,
            category.nameAr,
          );
          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative aspect-square overflow-hidden rounded-lg border border-black/10 bg-black/5 shadow-sm transition-[border-color,box-shadow] hover:border-gold-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <ImageFallback kind="category" tone="dark" />
              )}
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 p-3 text-center">
                <span className="inline-flex rounded-md px-2 py-1 text-sm font-semibold text-white">
                  {name}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}