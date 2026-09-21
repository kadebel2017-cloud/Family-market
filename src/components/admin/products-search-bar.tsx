"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

function buildUrl(
  pathname: string,
  query: string,
  categoryId: string | null,
): string {
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed !== "") {
    params.set("q", trimmed);
  }
  // The category is preserved in the URL so clearing the search returns to
  // the current category view. The server always ignores it while searching.
  if (categoryId) {
    params.set("categoryId", categoryId);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function ProductsSearchBar({
  initialQuery,
  categoryId,
}: {
  initialQuery: string;
  categoryId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stay in sync when the URL changes from outside this input (category
  // links, pagination, back/forward) — but never interrupt typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Debounced server-side search: only the query string travels to the URL,
  // the page itself re-renders on the server with a single result page.
  useEffect(() => {
    if (query.trim() === initialQuery.trim()) {
      return;
    }
    const handle = window.setTimeout(() => {
      router.replace(buildUrl(pathname, query, categoryId));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, initialQuery, categoryId, pathname, router]);

  function navigateNow(value: string) {
    router.replace(buildUrl(pathname, value, categoryId));
  }

  return (
    <form
      role="search"
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        navigateNow(query);
      }}
    >
      <label
        htmlFor="admin-product-search"
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        Recherche globale
      </label>
      <div className="relative w-full max-w-md">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={inputRef}
          id="admin-product-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom FR / AR, taille, SKU ou code-barres…"
          aria-label="Rechercher dans tout le catalogue"
          autoComplete="off"
          className="h-10 w-full rounded-md border border-black/15 bg-surface pr-9 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:outline-none"
        />
        {query !== "" ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              navigateNow("");
              inputRef.current?.focus();
            }}
            aria-label="Effacer la recherche"
            className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        La recherche porte toujours sur l&apos;ensemble du catalogue et ignore
        la catégorie sélectionnée.
      </p>
    </form>
  );
}
