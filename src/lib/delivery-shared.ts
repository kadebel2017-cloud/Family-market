// Pure delivery helpers shared by server code and client components.
// No server imports here — this module must stay client-safe.

export type DeliveryTypeValue = "HOME" | "OFFICE";

export interface WilayaPriceInput {
  code: string;
  homePrice: number;
  officePrice: number;
}

export interface DeliveryQuote {
  /** False when the wilaya has no active configured price. */
  matched: boolean;
  /** Final fee in DA. */
  fee: number;
  zone: WilayaPriceInput | null;
}

export interface WilayaOption {
  code: string;
  name: string;
  communes: string[];
}

export interface FreeDeliveryRuleInput {
  isEnabled: boolean;
  threshold: number;
  wilayaCode: string;
  wilayaName: string;
  commune: string;
  district: string;
  bannerEnabled: boolean;
  bannerTextFr: string | null;
  bannerTextAr: string | null;
}

// Accent/case/whitespace-insensitive comparison for commune names.
export function normalizePlaceName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Single source of truth for the delivery price rule: the fee comes
// from the admin-configured WilayaPrice row, home vs office.
// Unknown/unconfigured wilaya → unmatched (never invent a price).
export function quoteFromPrices(
  prices: WilayaPriceInput[],
  input: { wilayaCode: string; deliveryType: DeliveryTypeValue },
): DeliveryQuote {
  const zone =
    prices.find((price) => price.code === input.wilayaCode.trim()) ?? null;
  if (!zone) {
    return { matched: false, fee: 0, zone: null };
  }
  return {
    matched: true,
    fee: input.deliveryType === "OFFICE" ? zone.officePrice : zone.homePrice,
    zone,
  };
}

// Algerian phone numbers: digits with optional +, spaces and dashes.
export function isValidPhone(phone: string): boolean {
  const value = phone.trim();
  if (!/^[0-9+\-\s]+$/.test(value)) {
    return false;
  }
  return value.replace(/\D/g, "").length >= 9;
}
