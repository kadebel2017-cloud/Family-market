import Link from "next/link";

import { t, pickLocalized } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { CategoryCard } from "@/lib/public/queries";
import type { Locale } from "@/types";

function chipHref({
  category,
  q,
  sort,
}: {
  category?: string;
  q?: string;
  sort?: string;
}): string {
  const search = new URLSearchParams();
  if (q) {
    search.set("q", q);
  }
  if (category) {
    search.set("category", category);
  }
  if (sort && sort !== "relevance") {
    search.set("sort", sort);
  }
  const query = search.toString();
  return query ? `/products?${query}` : "/products";
}

export function CategoryChips({
  categories,
  activeSlug,
  q,
  sort,
  locale,
}: {
  categories: CategoryCard[];
  activeSlug?: string;
  q?: string;
  sort?: string;
  locale: Locale;
}) {
  if (categories.length === 0) {
    return null;
  }

  const base =
    "inline-flex shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";
  const inactive =
    "border-black/15 bg-surface text-foreground hover:border-gold-500 hover:text-gold-700";
  const active = "border-gold-500 bg-gold-500 text-white";

  return (
    <nav aria-label={t(locale, "titleCategories")} className="min-w-0">
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <li>
          <Link
            href={chipHref({ q, sort })}
            aria-current={!activeSlug ? "page" : undefined}
            className={cn(base, !activeSlug ? active : inactive)}
          >
            {t(locale, "allCategories")}
          </Link>
        </li>
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;
          return (
            <li key={category.id}>
              <Link
                href={chipHref({ category: category.slug, q, sort })}
                aria-current={isActive ? "page" : undefined}
                className={cn(base, isActive ? active : inactive)}
              >
                {pickLocalized(locale, category.nameFr, category.nameAr)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
