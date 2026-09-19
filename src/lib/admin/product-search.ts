export interface SearchableProduct {
  id: string;
  nameFr: string;
  nameAr: string;
  size: string;
  sku: string | null;
}

export interface ProductSearchResult<T extends SearchableProduct> {
  /** Exact SKU/barcode hit, if any. Takes priority over fuzzy results. */
  exact: T | null;
  results: T[];
  /** True when the query looks like a scanned barcode. */
  isBarcodeLike: boolean;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

// A scanned barcode is typically a run of digits (EAN-13, UPC, …).
export function isBarcodeLike(query: string): boolean {
  return /^[0-9]{4,}$/.test(query.trim());
}

export function filterProducts<T extends SearchableProduct>(
  products: T[],
  query: string,
  excludeIds?: Set<string>,
): ProductSearchResult<T> {
  const q = query.trim();
  const barcodeLike = isBarcodeLike(q);
  const excluded = excludeIds ?? new Set<string>();

  if (q === "") {
    return {
      exact: null,
      results: products.filter((p) => !excluded.has(p.id)),
      isBarcodeLike: false,
    };
  }

  // Exact barcode/SKU lookup first — never fuzzy-match a barcode.
  const lowered = q.toLowerCase();
  const exact =
    products.find(
      (p) => !excluded.has(p.id) && p.sku !== null && p.sku.trim().toLowerCase() === lowered,
    ) ?? null;
  if (exact) {
    return { exact, results: [exact], isBarcodeLike: barcodeLike };
  }

  return {
    exact: null,
    results: products.filter((p) => {
      if (excluded.has(p.id)) {
        return false;
      }
      return (
        normalize(p.nameFr).includes(lowered) ||
        normalize(p.nameAr).includes(lowered) ||
        normalize(p.size).includes(lowered) ||
        normalize(p.sku).includes(lowered)
      );
    }),
    isBarcodeLike: barcodeLike,
  };
}
