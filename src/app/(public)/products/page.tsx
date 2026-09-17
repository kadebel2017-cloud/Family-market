import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { getLocale } from "@/lib/i18n/locale";
import { t, tf, pickLocalized } from "@/lib/i18n/translations";
import { getProductsPage, getPublicCategories } from "@/lib/public/queries";
import { CatalogSearch } from "@/components/public/catalog/search-form";
import { CategoryChips } from "@/components/public/catalog/category-chips";
import { SortSelect } from "@/components/public/catalog/sort-select";
import { ProductGridCard } from "@/components/public/catalog/product-card";
import { Pagination } from "@/components/public/catalog/pagination";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title = t(locale, "titleProducts");
  const description = t(locale, "productsSubtitle");
  return {
    title,
    description,
    alternates: { canonical: "/products" },
    openGraph: {
      title,
      description,
      locale: locale === "ar" ? "ar_DZ" : "fr_FR",
      type: "website",
    },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;

  const q = params.q?.trim() || undefined;
  const category = params.category?.trim() || undefined;
  const sort = params.sort?.trim() || undefined;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [categories, result] = await Promise.all([
    getPublicCategories(),
    getProductsPage({ q, categorySlug: category, sort, page, locale }),
  ]);

  const activeCategory = category
    ? categories.find((item) => item.slug === category)
    : undefined;
  const heading = activeCategory
    ? pickLocalized(locale, activeCategory.nameFr, activeCategory.nameAr)
    : t(locale, "titleProducts");
  const hasFilters = Boolean(q || category);
  const countLabel =
    result.total === 1
      ? tf(locale, "productsCountOne", result.total)
      : tf(locale, "productsCountMany", result.total);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          {heading}
        </h1>
        <p className="text-muted-foreground">
          {t(locale, "productsSubtitle")}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        <CatalogSearch locale={locale} defaultValue={q ?? ""} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CategoryChips
            categories={categories}
            activeSlug={category}
            q={q}
            sort={sort}
            locale={locale}
          />
          <SortSelect
            locale={locale}
            q={q}
            category={category}
            sort={sort}
          />
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-6 text-sm text-muted-foreground"
      >
        {countLabel}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-black/15 bg-muted/40 px-6 py-16 text-center">
          <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-base font-medium text-foreground">
            {hasFilters
              ? t(locale, "noProductsFound")
              : t(locale, "productsEmpty")}
          </p>
          {hasFilters ? (
            <Link
              href="/products"
              className="mt-1 inline-flex h-10 items-center justify-center rounded-md bg-gold-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
            >
              {t(locale, "clearFilters")}
            </Link>
          ) : null}
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
              basePath="/products"
              params={{ q, category, sort }}
              locale={locale}
            />
          </div>
        </>
      )}
    </div>
  );
}
