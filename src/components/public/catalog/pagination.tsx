import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { t, tf } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }
  if (page > 1) {
    search.set("page", String(page));
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function pageWindow(current: number, total: number): (number | "gap")[] {
  const wanted = new Set<number>([
    1,
    total,
    current,
    current - 1,
    current + 1,
  ]);
  const sorted = [...wanted]
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) {
      result.push("gap");
    }
    result.push(value);
    previous = value;
  }
  return result;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  params = {},
  locale,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  locale: Locale;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const items = pageWindow(page, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const base =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500";
  const enabled =
    "border-black/15 bg-surface text-foreground hover:bg-black/5";
  const disabled =
    "cursor-not-allowed border-black/10 bg-muted/40 text-muted-foreground";

  return (
    <nav
      aria-label={tf(locale, "pageIndicator", page, totalPages)}
      className="flex items-center justify-center gap-2"
    >
      {isFirst ? (
        <span className={cn(base, disabled)} aria-disabled="true">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          <span className="hidden sm:inline">{t(locale, "pagePrevious")}</span>
        </span>
      ) : (
        <Link
          href={buildHref(basePath, params, page - 1)}
          rel="prev"
          className={cn(base, enabled)}
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          <span className="hidden sm:inline">{t(locale, "pagePrevious")}</span>
        </Link>
      )}

      <ul className="flex items-center gap-1">
        {items.map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={buildHref(basePath, params, item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  base,
                  item === page
                    ? "border-gold-500 bg-gold-500 text-white"
                    : enabled,
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>

      {isLast ? (
        <span className={cn(base, disabled)} aria-disabled="true">
          <span className="hidden sm:inline">{t(locale, "pageNext")}</span>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </span>
      ) : (
        <Link
          href={buildHref(basePath, params, page + 1)}
          rel="next"
          className={cn(base, enabled)}
        >
          <span className="hidden sm:inline">{t(locale, "pageNext")}</span>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </Link>
      )}
    </nav>
  );
}
