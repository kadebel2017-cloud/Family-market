import { Prisma } from "@/generated/prisma/client";

export const PROMOTION_TYPES = ["PRODUCT_DISCOUNT", "PACK"] as const;

export type PromotionType = (typeof PROMOTION_TYPES)[number];

export function parsePromotionType(raw: unknown): PromotionType | null {
  return raw === "PRODUCT_DISCOUNT" || raw === "PACK" ? raw : null;
}

export interface PackLineInput {
  unitPrice: Prisma.Decimal | string | number;
  quantity: number;
}

export interface PackTotals {
  normalTotal: Prisma.Decimal;
  savings: Prisma.Decimal;
}

// Safe decimal money math: normalTotal = Σ(unitPrice × quantity),
// savings = normalTotal − packPrice. Never touches Product.price.
export function calcPackTotals(
  lines: PackLineInput[],
  packPrice: Prisma.Decimal | string | number,
): PackTotals {
  const pack = new Prisma.Decimal(packPrice);
  let normalTotal = new Prisma.Decimal(0);
  for (const line of lines) {
    normalTotal = normalTotal.add(
      new Prisma.Decimal(line.unitPrice).mul(line.quantity),
    );
  }
  return { normalTotal, savings: normalTotal.sub(pack) };
}

export function formatDecimal(value: Prisma.Decimal | string | number): string {
  return new Prisma.Decimal(value).toFixed(2);
}
