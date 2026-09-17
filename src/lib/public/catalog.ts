import type { TranslationKey } from "@/lib/i18n/translations";

export interface SortOption {
  value: string;
  labelKey: TranslationKey;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  { value: "relevance", labelKey: "sortRelevance" },
  { value: "name_asc", labelKey: "sortNameAsc" },
  { value: "price_asc", labelKey: "sortPriceAsc" },
  { value: "price_desc", labelKey: "sortPriceDesc" },
  { value: "newest", labelKey: "sortNewest" },
];
