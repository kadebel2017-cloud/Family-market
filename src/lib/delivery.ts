import "server-only";

import { db } from "@/lib/db";
import { safeQuery } from "@/lib/admin/queries";
import { ALGERIA_WILAYAS, getWilayaEntry } from "@/data/algeria-wilayas";
import type {
  FreeDeliveryRuleInput,
  WilayaOption,
  WilayaPriceInput,
} from "./delivery-shared";

export interface DeliveryConfig {
  /** Active admin-configured prices, keyed list for the quote engine. */
  prices: WilayaPriceInput[];
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Server source of truth: only wilayas with an active WilayaPrice row
// are orderable. Always read fresh so Admin → Livraison changes apply
// immediately without a redeploy.
export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  const rows = await safeQuery(
    () =>
      db.wilayaPrice.findMany({
        where: { isActive: true },
        orderBy: { wilayaCode: "asc" },
      }),
    [],
  );
  // Safety: ignore price rows for unknown wilaya codes.
  const known = new Set(ALGERIA_WILAYAS.map((wilaya) => wilaya.code));
  return {
    prices: rows
      .filter((row) => known.has(row.wilayaCode))
      .map((row) => ({
        code: row.wilayaCode,
        homePrice: toNumber(row.homePrice),
        officePrice: toNumber(row.officePrice),
      })),
  };
}

// Select options for checkout: only priced (orderable) wilayas appear
// in the dropdown, each with its static commune list for autocomplete.
// New wilayas become orderable the moment an admin price row exists.
export function getCheckoutWilayas(orderableCodes: string[]): WilayaOption[] {
  const orderable = new Set(orderableCodes);
  return ALGERIA_WILAYAS.filter((wilaya) => orderable.has(wilaya.code)).map(
    (wilaya) => ({
      code: wilaya.code,
      name: wilaya.name,
      communes: wilaya.communes,
    }),
  );
}

export { getWilayaEntry };

// Global delivery-service switch. True when no row exists yet
// (service ON by default — current behavior preserved).
// Read fresh on every checkout load.
export async function isDeliveryEnabled(): Promise<boolean> {
  const settings = await safeQuery(
    () => db.deliverySettings.findUnique({ where: { id: "default" } }),
    null,
  );
  return settings?.deliveryEnabled ?? true;
}

// Free-delivery rule for checkout. Null when no rule row exists yet
// (treated as disabled). Read fresh on every checkout load.
export async function getFreeDeliveryRule(): Promise<FreeDeliveryRuleInput | null> {
  const rule = await safeQuery(
    () => db.freeDeliveryRule.findUnique({ where: { id: "default" } }),
    null,
  );
  if (!rule) {
    return null;
  }
  return {
    isEnabled: rule.isEnabled,
    threshold: toNumber(rule.threshold),
    wilayaCode: rule.wilayaCode,
    wilayaName: rule.wilayaName,
    commune: rule.commune,
    district: rule.district,
    bannerEnabled: rule.bannerEnabled,
    bannerTextFr: rule.bannerTextFr,
    bannerTextAr: rule.bannerTextAr,
  };
}
