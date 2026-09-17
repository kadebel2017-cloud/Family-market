"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

export function CatalogSearch({
  locale,
  defaultValue = "",
}: {
  locale: Locale;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = value.trim();
    startTransition(() => {
      router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    });
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            name="q"
            type="search"
            enterKeyHint="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={t(locale, "searchPlaceholder")}
            aria-label={t(locale, "searchPlaceholder")}
            className="h-11 w-full rounded-md border border-black/15 bg-surface ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={cn(
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-gold-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-60",
          )}
        >
          <Search className="h-4 w-4 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">{t(locale, "searchButton")}</span>
        </button>
      </div>
    </form>
  );
}
