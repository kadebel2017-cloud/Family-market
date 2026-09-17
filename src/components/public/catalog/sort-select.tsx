"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/public/catalog";
import type { Locale } from "@/types";

export function SortSelect({
  locale,
  q,
  category,
  sort,
}: {
  locale: Locale;
  q?: string;
  category?: string;
  sort?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const current =
    sort && SORT_OPTIONS.some((option) => option.value === sort)
      ? sort
      : "relevance";

  function handleChange(value: string) {
    const search = new URLSearchParams();
    if (q) {
      search.set("q", q);
    }
    if (category) {
      search.set("category", category);
    }
    if (value && value !== "relevance") {
      search.set("sort", value);
    }
    const query = search.toString();
    startTransition(() => {
      router.push(query ? `/products?${query}` : "/products");
    });
  }

  return (
    <label className="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground sm:w-auto sm:justify-start">
      <span className="whitespace-nowrap">{t(locale, "sortLabel")}</span>
      <select
        value={current}
        onChange={(event) => handleChange(event.target.value)}
        aria-busy={pending}
        className={cn(
          "h-10 min-w-0 flex-1 rounded-md border border-black/15 bg-surface px-3 text-sm font-medium text-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 sm:flex-none",
          pending && "opacity-60",
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(locale, option.labelKey)}
          </option>
        ))}
      </select>
    </label>
  );
}
